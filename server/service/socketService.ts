import historyService from './historyService';
import loggingService from './loggingService';
import queueService from './queueService';

/** The subset of a websocket peer that the socket service needs. */
export interface SocketPeer {
    id: string;
    send: (data: string) => unknown;
}

const peers: Map<string, SocketPeer> = new Map();

const serialise = (subject: string, message: any): string => JSON.stringify({ event: subject, data: message });

const socketService = {
    registerSocket: async (peer: SocketPeer) => {
        peers.set(peer.id, peer);

        const queue = queueService.getQueue();
        const history = await historyService.getHistory();

        peer.send(serialise('queue', queue));
        peer.send(serialise('history', history));
        loggingService.pushInitialLogs(peer.id);
    },

    removeSocket: (peer: SocketPeer) => {
        peers.delete(peer.id);
    },

    emit: (subject: string, message: any) => {
        const payload = serialise(subject, message);
        peers.forEach((peer) => peer.send(payload));
    },

    publish: (socketId: string, subject: string, message: any) => {
        peers.get(socketId)?.send(serialise(subject, message));
    }
};

export default socketService;
