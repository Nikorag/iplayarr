import statisticsService from '../../../src/service/stats/StatisticsService';
import { SearchHistoryEntry } from '../../../src/types/data/SearchHistoryEntry';
import { FixedFIFOQueue } from '../../../src/types/utils/FixedFIFOQueue';

describe('statisticsService', () => {
    // Clear history before each test run
    beforeEach(() => {
        statisticsService.searchHistory = new FixedFIFOQueue(10);
        statisticsService.clearSearchHistory(); // Use clearHistory to reset the queue
    });

    it('should add items to the history queue', async () => {
        const entry1: SearchHistoryEntry = { term: 'test1', results: 10, time: 1 };
        const entry2: SearchHistoryEntry = { term: 'test2', results: 15, time: 2 };

        statisticsService.addSearch(entry1);
        statisticsService.addSearch(entry2);

        const history = await statisticsService.getSearchHistory();
        expect(history).toHaveLength(2);
        expect(history[0].term).toBe('test1');
        expect(history[1].term).toBe('test2');
    });

    it('should respect the max size of the queue (10)', async () => {
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

    it('should return history in the correct order (FIFO)', async () => {
        const entry1: SearchHistoryEntry = { term: 'test1', results: 10, time: 1 };
        const entry2: SearchHistoryEntry = { term: 'test2', results: 20, time: 2 };

        statisticsService.addSearch(entry1);
        statisticsService.addSearch(entry2);

        const history = await statisticsService.getSearchHistory();
        expect(history[0].term).toBe('test1'); // The first added item
        expect(history[1].term).toBe('test2'); // The second added item
    });

    it('should only return items up to the max size', async () => {
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

    it('should clear history when clearHistory is called', async () => {
        const entry1: SearchHistoryEntry = { term: 'test1', results: 10, time: 1 };
        const entry2: SearchHistoryEntry = { term: 'test2', results: 15, time: 2 };

        statisticsService.addSearch(entry1);
        statisticsService.addSearch(entry2);

        // Clear history
        statisticsService.clearSearchHistory();

        const history = await statisticsService.getSearchHistory();
        expect(history).toHaveLength(0); // History should be empty
    });
});
