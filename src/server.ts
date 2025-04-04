import cors from 'cors'
import express, {Express, NextFunction, Request, Response} from 'express';
import http, { Server } from 'http';
import cron from 'node-cron';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';

import ApiRoute from './routes/ApiRoute';
import AuthRoute, { addAuthMiddleware } from './routes/authMiddleware';
import JsonApiRoute from './routes/JsonApiRoute';
import configService from './service/configService';
import iplayerService from './service/iplayerService';
import loggingService from './service/loggingService';
import offScheduleService from './service/offScheduleService';
import socketService from './service/socketService';
import swaggerDocument from './shared/tsoa/swagger.json';
import { RegisterRoutes } from './tsoa/routes';
import { IplayarrParameter } from './types/enums/IplayarrParameters';

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
RegisterRoutes(app);
app.use('/json-api', JsonApiRoute);

app.get('/api-docs/swagger.json', (req, res) => {
    res.json(swaggerDocument);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


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
configService.getItem(IplayarrParameter.REFRESH_SCHEDULE).then((cronSchedule) => {
    cron.schedule(cronSchedule as string, async () => {
        const nativeSearchEnabled = await configService.getItem(IplayarrParameter.NATIVE_SEARCH);
        if (nativeSearchEnabled == 'false'){
            iplayerService.refreshCache();
            offScheduleService.recacheAllSeries();
        }
    });
});