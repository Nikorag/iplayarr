import { Server, Socket } from 'socket.io';

import historyService from './historyService';
import loggingService from './loggingService';
import queueService from './queueService';

const sockets: {
    [key: string]: Socket;
} = {};
let io: Server | undefined = undefined;

const socketService = {
    registerIo: (server: Server) => {
        io = server;
        io.on('connection', (socket) => {
            socketService.registerSocket(socket);
            loggingService.pushInitialLogs(socket.id);
        });
    },

    registerSocket: async (socket: Socket) => {
        sockets[socket.id] = socket;

        const queue = queueService.getQueue();
        const history = await historyService.getHistory();

        socket.emit('queue', queue);
        socket.emit('history', history);

        socket.on('disconnect', () => {
            delete sockets[socket.id];
        });
    },

    emit: (subject: string, message: any) => {
        (io as Server).emit(subject, message);
    },

    publish: (socketId: string, subject: string, message: any) => {
        const socket = sockets[socketId];
        if (socket) {
            socket.emit(subject, message);
        }
    }
};

export default socketService;
