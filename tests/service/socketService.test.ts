import historyService from '../../server/service/historyService';
import loggingService from '../../server/service/loggingService';
import queueService from '../../server/service/queueService';
import socketService, { SocketPeer } from '../../server/service/socketService';

// Mock dependencies
jest.mock('../../server/service/historyService');
jest.mock('../../server/service/queueService');
jest.mock('../../server/service/loggingService');

describe('socketService', () => {
    let peer: jest.Mocked<SocketPeer>;
    let otherPeer: jest.Mocked<SocketPeer>;

    beforeEach(() => {
        peer = { id: 'peer123', send: jest.fn() };
        otherPeer = { id: 'peer456', send: jest.fn() };

        (historyService.getHistory as jest.Mock).mockResolvedValue(['mockedHistory']);
        (queueService.getQueue as jest.Mock).mockReturnValue(['mockedQueue']);
    });

    afterEach(() => {
        socketService.removeSocket(peer);
        socketService.removeSocket(otherPeer);
        jest.clearAllMocks();
    });

    describe('registerSocket', () => {
        it('should send the current queue and history, and replay recent logs', async () => {
            await socketService.registerSocket(peer);

            expect(peer.send).toHaveBeenCalledWith(JSON.stringify({ event: 'queue', data: ['mockedQueue'] }));
            expect(peer.send).toHaveBeenCalledWith(JSON.stringify({ event: 'history', data: ['mockedHistory'] }));
            expect(loggingService.pushInitialLogs).toHaveBeenCalledWith('peer123');
        });
    });

    describe('removeSocket', () => {
        it('should stop sending events to a removed peer', async () => {
            await socketService.registerSocket(peer);
            peer.send.mockClear();

            socketService.removeSocket(peer);
            socketService.emit('queue', []);

            expect(peer.send).not.toHaveBeenCalled();
        });
    });

    describe('emit', () => {
        it('should broadcast to every registered peer', async () => {
            await socketService.registerSocket(peer);
            await socketService.registerSocket(otherPeer);
            peer.send.mockClear();
            otherPeer.send.mockClear();

            socketService.emit('test-event', { foo: 'bar' });

            const expected = JSON.stringify({ event: 'test-event', data: { foo: 'bar' } });
            expect(peer.send).toHaveBeenCalledWith(expected);
            expect(otherPeer.send).toHaveBeenCalledWith(expected);
        });
    });

    describe('publish', () => {
        it('should send only to the targeted peer', async () => {
            await socketService.registerSocket(peer);
            await socketService.registerSocket(otherPeer);
            peer.send.mockClear();
            otherPeer.send.mockClear();

            socketService.publish('peer123', 'custom', 'message');

            expect(peer.send).toHaveBeenCalledWith(JSON.stringify({ event: 'custom', data: 'message' }));
            expect(otherPeer.send).not.toHaveBeenCalled();
        });

        it('should do nothing for an unknown peer', () => {
            expect(() => socketService.publish('missing', 'custom', 'message')).not.toThrow();
        });
    });
});
