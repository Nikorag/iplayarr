import 'module-alias/register';

import cors from 'cors'
import express, {Express, NextFunction, Request, Response} from 'express';
import http, { Server } from 'http';
import cron from 'node-cron';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import ApiRoute from 'src/routes/ApiRoute';
import AuthRoute, { addAuthMiddleware } from 'src/routes/AuthRoute';
import JsonApiRoute from 'src/routes/JsonApiRoute';
import configService from 'src/service/configService';
import episodeCacheService from 'src/service/episodeCacheService';
import iplayerService from 'src/service/iplayerService';
import loggingService from 'src/service/loggingService';
import socketService from 'src/service/socketService';
import { IplayarrParameter } from 'src/types/enums/IplayarrParameters';

const isDebug = process.env.DEBUG == 'true';

const app : Express = express();
const port : number = parseInt(process.env[IplayarrParameter.PORT.toString()] || '4404');

if (isDebug){
    app.use(cors({
        origin: (origin, callback) => {
            callback(null, origin)
        },
        credentials: true
    }));
}

// Session and Auth
app.use(express.json());
addAuthMiddleware(app);
app.use('/auth', AuthRoute);


app.use(express.static(path.join(process.cwd(), 'frontend', 'dist')));

// Middleware
app.use((req : Request, _ : Response, next : NextFunction) => {
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
const server : Server = http.createServer(app);

const io = isDebug ? new SocketIOServer(server, {cors : {}}) : new SocketIOServer(server);
socketService.registerIo(io);

server.listen(port, () => {
    loggingService.log(`Server running at http://localhost:${port}`);
});

//Cron
configService.getParameter(IplayarrParameter.REFRESH_SCHEDULE).then((cronSchedule) => {
    cron.schedule(cronSchedule as string, async () => {
        const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);
        if (nativeSearchEnabled == 'false'){
            iplayerService.refreshCache();
            episodeCacheService.recacheAllSeries();
        }
    });
});
