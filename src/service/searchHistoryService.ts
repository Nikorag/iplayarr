import { SearchHistoryEntry } from '../types/SearchHistoryEntry';
import { AbstractFIFOQueue } from '../types/utils/AbstractFIFOQueue';
import { RedisFIFOQueue } from '../types/utils/RedisFIFOQueue';

class SearchHistoryService {
    history: AbstractFIFOQueue<SearchHistoryEntry>;

    constructor() {
        this.history = new RedisFIFOQueue('search-history', 10);;
    }

    addItem(entry: SearchHistoryEntry): void {
        this.history.enqueue(entry);
    }

    async getHistory(): Promise<SearchHistoryEntry[]> {
        return await this.history.getItems();
    }

    async clearHistory(): Promise<void> {
        await this.history.clear();
    }
}

export default new SearchHistoryService();
