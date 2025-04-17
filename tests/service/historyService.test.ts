const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('src/helpers/QueuedStorage', () => {
    return {
        QueuedStorage: jest.fn().mockImplementation(() => ({
            getItem: mockGetItem,
            setItem: mockSetItem
        }))
    };
});

jest.mock('src/service/socketService', () => ({
    __esModule: true,
    default: { emit: jest.fn() }
}));

import historyService from 'src/service/historyService';
import socketService from 'src/service/socketService';
import { VideoType } from 'src/types/data/IPlayerSearchResult';
import { QueueEntry } from 'src/types/models/QueueEntry';
import { QueueEntryStatus } from 'src/types/responses/sabnzbd/QueueResponse';

const sampleEntry: QueueEntry = {
    pid: '123',
    status: QueueEntryStatus.QUEUED,
    nzbName: 'Test NZB',
    type: VideoType.MOVIE,
    details: {},
    appId: 'radarr'
};

beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue([]);
    mockSetItem.mockResolvedValue(undefined);
});

describe('historyService', () => {
    it('getHistory returns empty array if none exists', async () => {
        mockGetItem.mockResolvedValue(undefined);
        const result = await historyService.getHistory();
        expect(result).toEqual([]);
    });

    it('addHistory stores a completed item', async () => {
        await historyService.addHistory(sampleEntry);
        expect(mockSetItem).toHaveBeenCalledWith(
            'history',
            expect.arrayContaining([
                expect.objectContaining({
                    pid: '123',
                    status: QueueEntryStatus.COMPLETE
                })
            ])
        );
        expect(socketService.emit).toHaveBeenCalledWith('history', expect.any(Array));
    });

    it('addRelay stores raw item', async () => {
        await historyService.addRelay(sampleEntry);
        expect(mockSetItem).toHaveBeenCalledWith(
            'history',
            expect.arrayContaining([
                expect.objectContaining({
                    pid: '123',
                    status: QueueEntryStatus.QUEUED
                })
            ])
        );
    });

    it('addArchive stores item with CANCELLED status', async () => {
        await historyService.addArchive(sampleEntry);
        expect(mockSetItem).toHaveBeenCalledWith(
            'history',
            expect.arrayContaining([
                expect.objectContaining({
                    pid: '123',
                    status: QueueEntryStatus.CANCELLED
                })
            ])
        );
    });

    it('removeHistory filters out entry by PID', async () => {
        mockGetItem.mockResolvedValue([
            { ...sampleEntry, pid: '123' },
            { ...sampleEntry, pid: '456' }
        ]);
        await historyService.removeHistory('123');
        expect(mockSetItem).toHaveBeenCalledWith(
            'history',
            [expect.objectContaining({ pid: '456' })]
        );
    });
});
