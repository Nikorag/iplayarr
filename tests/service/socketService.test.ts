import { Server, Socket } from 'socket.io';
import historyService from '../../src/service/historyService';
import queueService from '../../src/service/queueService';
import socketService from '../../src/service/socketService';

// Mock dependencies
jest.mock('../../src/service/historyService');
jest.mock('../../src/service/queueService');

describe('socketService', () => {
    let mockIo: jest.Mocked<Server>;
    let mockSocket: jest.Mocked<Socket>;

    beforeEach(() => {
        mockIo = {
            on: jest.fn(),
            emit: jest.fn(),
        } as any;

        mockSocket = {
            id: 'socket123',
            emit: jest.fn(),
            on: jest.fn().mockReturnThis(), // Ensure it returns the Socket object
        } as any;

        (historyService.getHistory as jest.Mock).mockResolvedValue(['mockedHistory']);
        (queueService.getQueue as jest.Mock).mockReturnValue(['mockedQueue']);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerIo', () => {
        it('should register the connection listener', () => {
            socketService.registerIo(mockIo);
            expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
        });
    });

    describe('registerSocket', () => {
        it('should register socket, emit queue/history, and handle disconnect', async () => {
            const disconnectCallback = jest.fn();
            mockSocket.on.mockImplementation((event, cb) => {
                if (event === 'disconnect') {
                    disconnectCallback.mockImplementation(cb);
                }
                return mockSocket; // Return mockSocket to satisfy the method chaining
            });

            await socketService.registerSocket(mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith('queue', ['mockedQueue']);
            expect(mockSocket.emit).toHaveBeenCalledWith('history', ['mockedHistory']);
            expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));

            // Simulate disconnect
            disconnectCallback();
        });
    });

    describe('emit', () => {
        it('should emit message using io server', () => {
            socketService.registerIo(mockIo);
            socketService.emit('testEvent', { msg: 'hello' });

            expect(mockIo.emit).toHaveBeenCalledWith('testEvent', { msg: 'hello' });
        });
    });
});
