import RedisCacheService from '../../../src/service/redis/redisCacheService';
import { redis } from '../../../src/service/redis/redisService';
import statisticsService from '../../../src/service/stats/StatisticsService';
import { GrabHistoryEntry } from '../../../src/types/data/GrabHistoryEntry';
import { SearchHistoryEntry } from '../../../src/types/data/SearchHistoryEntry';
import { VideoType } from '../../../src/types/IPlayerSearchResult';
import { FixedFIFOQueue } from '../../../src/types/utils/FixedFIFOQueue';

jest.mock('../../../src/service/redis/redisService');

describe('statisticsService', () => {
    // Clear history before each test run
    beforeEach(() => {
        statisticsService.searchHistory = new FixedFIFOQueue(10);
        statisticsService.clearSearchHistory();
        statisticsService.grabHistory = new FixedFIFOQueue(10);
        statisticsService.clearGrabHistory();

        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it('should add items to the search history queue', async () => {
        const entry1: SearchHistoryEntry = { term: 'test1', results: 10, time: 1 };
        const entry2: SearchHistoryEntry = { term: 'test2', results: 15, time: 2 };

        statisticsService.addSearch(entry1);
        statisticsService.addSearch(entry2);

        const history = await statisticsService.getSearchHistory();
        expect(history).toHaveLength(2);
        expect(history[0].term).toBe('test1');
        expect(history[1].term).toBe('test2');
    });

    it('should respect the max size of the search queue (10)', async () => {
        const maxSize = 10;

        // Add more than 10 entries
        for (let i = 1; i <= 15; i++) {
            const entry: SearchHistoryEntry = { term: `test${i}`, results: i * 5, time: i };
            statisticsService.addSearch(entry);
        }

        const history = await statisticsService.getSearchHistory();
        expect(history).toHaveLength(maxSize); // should only store 10 entries
        expect(history[0].term).toBe('test6'); // The oldest item should be the 6th item
    });

    it('should return search history in the correct order (FIFO)', async () => {
        const entry1: SearchHistoryEntry = { term: 'test1', results: 10, time: 1 };
        const entry2: SearchHistoryEntry = { term: 'test2', results: 20, time: 2 };

        statisticsService.addSearch(entry1);
        statisticsService.addSearch(entry2);

        const history = await statisticsService.getSearchHistory();
        expect(history[0].term).toBe('test1'); // The first added item
        expect(history[1].term).toBe('test2'); // The second added item
    });

    it('should only return search items up to the max size', async () => {
        const maxSize = 10;

        // Add more than the max size of the queue
        for (let i = 1; i <= 15; i++) {
            const entry: SearchHistoryEntry = { term: `query${i}`, results: i * 5, time: i };
            statisticsService.addSearch(entry);
        }

        const history = await statisticsService.getSearchHistory();
        expect(history).toHaveLength(maxSize);
        expect(history[0].term).toBe('query6'); // The queue should discard old entries
    });

    it('should clear search history when clearHistory is called', async () => {
        const entry1: SearchHistoryEntry = { term: 'test1', results: 10, time: 1 };
        const entry2: SearchHistoryEntry = { term: 'test2', results: 15, time: 2 };

        statisticsService.addSearch(entry1);
        statisticsService.addSearch(entry2);

        // Clear history
        statisticsService.clearSearchHistory();

        const history = await statisticsService.getSearchHistory();
        expect(history).toHaveLength(0); // History should be empty
    });

    it('should add items to the grab history queue', async () => {
        const entry1: GrabHistoryEntry = { pid: 'test1', nzbName: 'test1', time: 1, type: VideoType.TV };
        const entry2: GrabHistoryEntry = { pid: 'test2', nzbName: 'test2', time: 1, type: VideoType.TV };

        statisticsService.addGrab(entry1);
        statisticsService.addGrab(entry2);

        const history = await statisticsService.getGrabHistory();
        expect(history).toHaveLength(2);
        expect(history[0].pid).toBe('test1');
        expect(history[1].pid).toBe('test2');
    });

    it('should respect the max size of the grab queue (10)', async () => {
        const maxSize = 10;

        // Add more than 10 entries
        for (let i = 1; i <= 15; i++) {
            const entry: GrabHistoryEntry = { pid: `test${i}`, nzbName: `test${i}`, time: i, type: VideoType.TV };
            statisticsService.addGrab(entry);
        }

        const history = await statisticsService.getGrabHistory();
        expect(history).toHaveLength(maxSize); // should only store 10 entries
        expect(history[0].pid).toBe('test6'); // The oldest item should be the 6th item
    });

    it('should return grab history in the correct order (FIFO)', async () => {
        const entry1: GrabHistoryEntry = { pid: 'test1', nzbName: 'test1', time: 1, type: VideoType.TV };
        const entry2: GrabHistoryEntry = { pid: 'test2', nzbName: 'test2', time: 1, type: VideoType.TV };

        statisticsService.addGrab(entry1);
        statisticsService.addGrab(entry2);

        const history = await statisticsService.getGrabHistory();
        expect(history[0].pid).toBe('test1'); // The first added item
        expect(history[1].pid).toBe('test2'); // The second added item
    });

    it('should only return grab items up to the max size', async () => {
        const maxSize = 10;

        // Add more than the max size of the queue
        for (let i = 1; i <= 15; i++) {
            const entry: GrabHistoryEntry = { pid: `test${i}`, nzbName: `test${i}`, time: i, type: VideoType.TV };
            statisticsService.addGrab(entry);
        }

        const history = await statisticsService.getGrabHistory();
        expect(history).toHaveLength(maxSize);
        expect(history[0].pid).toBe('test6'); // The queue should discard old entries
    });

    it('should clear grab history when clearHistory is called', async () => {
        const entry1: GrabHistoryEntry = { pid: 'test1', nzbName: 'test1', time: 1, type: VideoType.TV };
        const entry2: GrabHistoryEntry = { pid: 'test2', nzbName: 'test2', time: 1, type: VideoType.TV };

        statisticsService.addGrab(entry1);
        statisticsService.addGrab(entry2);

        // Clear history
        statisticsService.clearGrabHistory();

        const history = await statisticsService.getGrabHistory();
        expect(history).toHaveLength(0); // History should be empty
    });

    it('setUptime stores current timestamp in Redis', async () => {
        const now = Date.now();
        jest.spyOn(global.Date, 'now').mockReturnValueOnce(now);

        await statisticsService.setUptime();

        expect(redis.set).toHaveBeenCalledWith('iplayarr_uptime', now);
    });

    it('getUptime returns difference between now and stored uptime', async () => {
        const now = 50000;
        const past = now - 5000;
        jest.spyOn(global.Date, 'now').mockReturnValue(now);
        (redis.get as jest.Mock).mockResolvedValue(past.toString());

        const result = await statisticsService.getUptime();

        expect(result).toBe(5000);
    });

    it('getUptime returns 0 if uptime is not set', async () => {
        (redis.get as jest.Mock).mockResolvedValue(null);

        const result = await statisticsService.getUptime();

        expect(result).toBe(0);
    });

    describe('RedisCacheService.getCacheSizes', () => {
        it('returns the correct cache sizes for search and schedule', async () => {
            const getCacheSizeInMBSpy = jest
                .spyOn(RedisCacheService, 'getCacheSizeInMB')
                .mockImplementation((patterns: string[]) => {
                    if (patterns.includes('search_cache_*')) return Promise.resolve('1.23');
                    if (patterns.includes('schedule_cache_*')) return Promise.resolve('4.56');
                    return Promise.resolve('0.00');
                });

            const sizes = await statisticsService.getCacheSizes();

            expect(sizes).toEqual({
                search: '1.23',
                schedule: '4.56'
            })

            expect(getCacheSizeInMBSpy).toHaveBeenCalledTimes(2);
            expect(getCacheSizeInMBSpy).toHaveBeenCalledWith(['search_cache_*']);
            expect(getCacheSizeInMBSpy).toHaveBeenCalledWith(['schedule_cache_*']);
        });
    });
});
