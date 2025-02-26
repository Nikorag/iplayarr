import express from 'express';
import http from 'http';
import { getParameter } from './service/configService.js';
import { directory } from './endpoints/endpointDirectory.js';
import multer from 'multer';
import cron from 'node-cron';
import iplayerService from './service/iplayerService.js';
import path from 'path';
import jsonapi from './routes/jsonapi.js';
import { Server as SocketIOServer } from "socket.io";
import socketService from './service/socketService.js';
import loggingService from './service/loggingService.js';

const app = express();
const port = 4404;
const cronSchedule = getParameter("REFRESH_SCHEDULE") || "0 * * * *";

const upload = multer();
app.use(express.json());

const __dirname = path.resolve(); // Ensure __dirname works in ES module
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

app.use('/api', upload.any(), (req, res) => {
    
    loggingService.debug('Request received:');
    loggingService.debug('Method:', req.method);
    loggingService.debug('URL:', req.url);
    loggingService.debug('Headers:', req.headers);
    loggingService.debug('Body:', req.body);

    const {apikey : queryKey, mode, t} = req.query;
    const envKey = getParameter('API_KEY');
    if (envKey === queryKey){
        const endpoint = mode ?? t;
        if (Object.keys(directory).includes(endpoint)){
            directory[endpoint](req, res);
        } else {
            res.status(404).json({ "error": "Not found" });
        }
    } else {
        res.status(401).json({ "error": "Not authorised" });
    }
});

app.use('/json-api', jsonapi);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

cron.schedule(cronSchedule, () => {
  iplayerService.refreshCache();
});

const server = http.createServer(app);

const io = new SocketIOServer(server);
socketService.registerIo(io);

io.on("connection", (socket) => {
    socketService.registerSocket(socket);
});

server.listen(port, () => {
    loggingService.log(`Server running at http://localhost:${port}`);
});
