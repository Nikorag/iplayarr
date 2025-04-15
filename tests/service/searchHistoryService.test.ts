import searchHistoryService from 'src/service/searchHistoryService';
import { SearchHistoryEntry } from 'src/types/SearchHistoryEntry';

describe('searchHistoryService', () => {
    // Clear history before each test run
    beforeEach(() => {
        searchHistoryService.clearHistory(); // Use clearHistory to reset the queue
    });

    it('should add items to the history queue', () => {
        const entry1: SearchHistoryEntry = { term: 'test1', results: 10 };
        const entry2: SearchHistoryEntry = { term: 'test2', results: 15 };

        searchHistoryService.addItem(entry1);
        searchHistoryService.addItem(entry2);

        const history = searchHistoryService.getHistory();
        expect(history).toHaveLength(2);
        expect(history[0].term).toBe('test1');
        expect(history[1].term).toBe('test2');
    });

    it('should respect the max size of the queue (10)', () => {
        const maxSize = 10;

        // Add more than 10 entries
        for (let i = 1; i <= 15; i++) {
            const entry: SearchHistoryEntry = { term: `test${i}`, results: i * 5 };
            searchHistoryService.addItem(entry);
        }

        const history = searchHistoryService.getHistory();
        expect(history).toHaveLength(maxSize); // should only store 10 entries
        expect(history[0].term).toBe('test6'); // The oldest item should be the 6th item
    });

    it('should return history in the correct order (FIFO)', () => {
        const entry1: SearchHistoryEntry = { term: 'test1', results: 10 };
        const entry2: SearchHistoryEntry = { term: 'test2', results: 20 };

        searchHistoryService.addItem(entry1);
        searchHistoryService.addItem(entry2);

        const history = searchHistoryService.getHistory();
        expect(history[0].term).toBe('test1'); // The first added item
        expect(history[1].term).toBe('test2'); // The second added item
    });

    it('should only return items up to the max size', () => {
        const maxSize = 10;

        // Add more than the max size of the queue
        for (let i = 1; i <= 15; i++) {
            const entry: SearchHistoryEntry = { term: `query${i}`, results: i * 5 };
            searchHistoryService.addItem(entry);
        }

        const history = searchHistoryService.getHistory();
        expect(history).toHaveLength(maxSize);
        expect(history[0].term).toBe('query6'); // The queue should discard old entries
    });

    it('should clear history when clearHistory is called', () => {
        const entry1: SearchHistoryEntry = { term: 'test1', results: 10 };
        const entry2: SearchHistoryEntry = { term: 'test2', results: 15 };

        searchHistoryService.addItem(entry1);
        searchHistoryService.addItem(entry2);

        // Clear history
        searchHistoryService.clearHistory();

        const history = searchHistoryService.getHistory();
        expect(history).toHaveLength(0); // History should be empty
    });
});
