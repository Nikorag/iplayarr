import { Server, Socket } from 'socket.io';

import historyService from '../../src/service/historyService';
import queueService from '../../src/service/queueService';
import socketService from '../../src/service/socketService';

jest.mock('../../src/service/historyService', () => ({
    getHistory: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../src/service/queueService', () => ({
    getQueue: jest.fn(() => []),
}));

describe('socketService', () => {
    let io: Server;
    let socket: Socket;
    let emitMock: jest.Mock;

    beforeEach(() => {
        emitMock = jest.fn();
        io = {
            on: jest.fn((event: string, callback: (socket: Socket) => void) => {
                if (event === 'connection') {
                    callback(socket);
                }
            }),
            emit: emitMock,
        } as any as Server;

        socket = {
            id: 'testSocketId',
            emit: jest.fn(),
            on: jest.fn(),
            disconnect: jest.fn(),
        } as any as Socket;

        socketService.registerIo(io);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new io server', () => {
        expect(io.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should register a new socket', async () => {
        const history : any[] = [];
        const queue : any[] = [];

        (historyService.getHistory as jest.Mock).mockResolvedValue(history);
        (queueService.getQueue as jest.Mock).mockReturnValue(queue);

        socketService.registerSocket(socket);

        expect(socket.emit).toHaveBeenCalledWith('queue', queue);
        expect(socket.emit).toHaveBeenCalledWith('history', history);
        expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should emit a message to all connected sockets', () => {
        const subject = 'testSubject';
        const message = { test: 'message' };

        socketService.emit(subject, message);

        expect(emitMock).toHaveBeenCalledWith(subject, message);
    });

    it('should handle socket disconnection', () => {
        const disconnectCallback = (socket.on as jest.Mock).mock.calls
            .find((call: any) => call[0] === 'disconnect')?.[1];

        disconnectCallback();
    });
});