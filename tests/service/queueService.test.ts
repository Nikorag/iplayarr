import { spawn } from 'child_process';

import configService from '../../src/service/configService';
import historyService from '../../src/service/historyService';
import iplayerService from '../../src/service/iplayerService';
import queueService from '../../src/service/queueService';
import { VideoType } from '../../src/types/IPlayerSearchResult';
import { QueueEntryStatus } from '../../src/types/responses/sabnzbd/QueueResponse';

jest.mock('../../src/service/configService', () => ({
    __esModule: true,
    default: {
        getParameter: jest.fn(),
    },
}));

jest.mock('../../src/service/iplayerService', () => ({
    __esModule: true,
    default: {
        download: jest.fn(),
    },
}));

jest.mock('../../src/service/socketService', () => ({
    __esModule: true,
    default: {
        emit: jest.fn(),
    },
}));

jest.mock('../../src/service/historyService', () => ({
    __esModule: true,
    default: {
        addArchive: jest.fn(),
    },
}));

jest.mock('child_process', () => ({
    spawn: jest.fn(),
}));

describe('queueService', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Reset the internal queue
        while (queueService.getQueue().length > 0) {
            queueService.removeFromQueue(queueService.getQueue()[0].pid);
        }
    });

    describe('addToQueue', () => {
        it('adds a queue item and starts moveQueue', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue('1');
            (iplayerService.download as jest.Mock).mockResolvedValue({ pid: 999 });

            queueService.addToQueue('123', 'Test NZB', VideoType.TV, 'myApp');

            await new Promise((r) => setTimeout(r, 10)); // wait for async `moveQueue`

            const queue = queueService.getQueue();
            expect(queue.length).toBe(1);
            expect(queue[0]).toMatchObject({
                pid: '123',
                status: QueueEntryStatus.DOWNLOADING,
                nzbName: 'Test NZB',
                type: VideoType.TV,
                appId: 'myApp',
            });
        });
    });

    describe('updateQueue', () => {
        it('updates a queue item\'s details', () => {
            queueService.addToQueue('456', 'Another NZB', VideoType.MOVIE);
            queueService.updateQueue('456', { progress: 80 });

            const item = queueService.getFromQueue('456');
            expect(item?.details?.progress).toBe(80);
        });
    });

    describe('removeFromQueue', () => {
        it('removes item by pid and triggers moveQueue', () => {
            queueService.addToQueue('789', 'NZB Name', VideoType.MOVIE);
            expect(queueService.getFromQueue('789')).toBeDefined();

            queueService.removeFromQueue('789');
            expect(queueService.getFromQueue('789')).toBeUndefined();
        });
    });

    describe('cancelItem', () => {
        it('kills process and removes item', () => {
            const mockSpawn = spawn as jest.Mock;
            queueService.addToQueue('killme', 'Kill NZB', VideoType.TV);
            const item = queueService.getFromQueue('killme');
            if (item) {
                item.process = { pid: 1234 } as any;
            }

            queueService.cancelItem('killme');
            expect(mockSpawn).toHaveBeenCalledWith('kill', ['-9', '1234']);
            expect(queueService.getFromQueue('killme')).toBeUndefined();
        });

        it('archives the item if requested', () => {
            queueService.addToQueue('archive', 'Archive NZB', VideoType.MOVIE);
            const item = queueService.getFromQueue('archive');
            if (item) {
                item.process = { pid: 5678 } as any;
            }

            queueService.cancelItem('archive', true);
            expect(historyService.addArchive).toHaveBeenCalledWith(expect.objectContaining({ pid: 'archive' }));
        });
    });

    describe('getQueue and getFromQueue', () => {
        it('gets the full queue and specific item', () => {
            queueService.addToQueue('321', 'QueueItem', VideoType.TV);
            const fullQueue = queueService.getQueue();
            expect(fullQueue.length).toBeGreaterThan(0);
            expect(queueService.getFromQueue('321')).toEqual(expect.objectContaining({ pid: '321' }));
        });
    });
});
