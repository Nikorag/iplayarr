import 'module-alias/register';

import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import http, { Server } from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';

import { getDatabase } from './db/database';
import { migrateFromRedisIfNeeded } from './migration/redisMigrationService';
import ApiRoute from './routes/ApiRoute';
import AuthRoute, { addAuthMiddleware, sessionMiddleware, socketAuthMiddleware } from './routes/AuthRoute';
import JsonApiRoute from './routes/JsonApiRoute';
import loggingService from './service/loggingService';
import socketService from './service/socketService';
import StatisticsService from './service/stats/StatisticsService';
import taskService from './service/taskService';
import { IplayarrParameter } from './types/IplayarrParameters';

const isDebug = process.env.DEBUG == 'true';

const app: Express = express();
const port: number = parseInt(process.env[IplayarrParameter.PORT.toString()] || '4404');

if (isDebug) {
    app.use(
        cors({
            origin: (origin, callback) => {
                callback(null, origin);
            },
            credentials: true,
        })
    );
}

// Session and Auth
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
addAuthMiddleware(app);
app.use('/auth', AuthRoute);

// Healthcheck endpoint (unauthenticated)
app.get('/ping', async (_req: Request, res: Response) => {
    try {
        await (await getDatabase()).ping();
        res.json({ status: 'OK' });
    } catch (error : any) {
        res.status(503).json({ status: 'ERROR', message: `Database error - ${error?.message}`});
    }
});

app.use(express.static(path.join(process.cwd(), 'frontend', 'dist')));

// Middleware
app.use((req: Request, _: Response, next: NextFunction) => {
    loggingService.debug('Request received:');
    loggingService.debug('Method:', req.method);
    loggingService.debug('URL:', req.url);
    loggingService.debug('Headers:', req.headers);
    loggingService.debug('Body:', req.body);
    next();
});

// Routes
app.use('/api', ApiRoute);
app.use('/json-api', JsonApiRoute);
app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend', 'dist', 'index.html'));
});

// Start the server
const server: Server = http.createServer(app);

const io = isDebug ? new SocketIOServer(server, { cors: {} }) : new SocketIOServer(server);

// Socket.io auth: apply session cookie parsing, then check for authenticated user
io.use((socket, next) => {
    sessionMiddleware(socket.request as Request, {} as Response, next as NextFunction);
});
io.use(socketAuthMiddleware);

socketService.registerIo(io);

const start = async () => {
    // Open the database (applying schema migrations) and import any legacy Redis data before serving requests
    await migrateFromRedisIfNeeded((...args) => loggingService.log(...args));

    server.listen(port, '0.0.0.0', () => {
        loggingService.log(`Server running at http://0.0.0.0:${port}`);
        StatisticsService.setUptime();
    });
};

start().catch((error) => {
    loggingService.error(`Failed to start iPlayarr: ${error?.message ?? error}`);
    process.exit(1);
});

//Cron
taskService.init();
