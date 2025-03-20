import { Server, Socket } from 'socket.io';

import historyService from './historyService';
import queueService from './queueService';

const sockets : {
    [key : string] : Socket
} = {};
let io : Server | undefined = undefined;

const socketService = {

    registerIo : (server : Server) => {
        io = server;
        io.on('connection', (socket) => {
            socketService.registerSocket(socket);
        });
    },

    registerSocket : async (socket : Socket) => {
        sockets[socket.id] = socket;

        const queue = await queueService.all();
        const history = await historyService.all();

        socket.emit('queue', queue);
        socket.emit('history', history);

        socket.on('disconnect', () => {
            delete sockets[socket.id];
        });
    },

    emit : (subject : string, message : any) => {
        (io as Server).emit(subject, message);
    }
}

export default socketService;