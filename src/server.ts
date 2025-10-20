import 'module-alias/register';

import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import http, { Server } from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';

import ApiRoute from './routes/ApiRoute';
import AuthRoute, { addAuthMiddleware } from './routes/AuthRoute';
import JsonApiRoute from './routes/JsonApiRoute';
import loggingService from './service/loggingService';
import socketService from './service/socketService';
import StatisticsService from './service/stats/StatisticsService';
import taskService from './service/taskService';
import { IplayarrParameter } from './types/IplayarrParameters';
import { redis } from './service/redis/redisService';

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
        await redis.ping();
        res.json({ status: 'OK' });
    } catch (error) {
        res.status(503).json({ status: 'ERROR', message: 'Redis unavailable' });
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
socketService.registerIo(io);

server.listen(port, () => {
    loggingService.log(`Server running at http://localhost:${port}`);
    StatisticsService.setUptime();
});

//Cron
taskService.init();