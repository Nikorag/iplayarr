import { GrabHistoryEntry } from '../../types/data/GrabHistoryEntry';
import { SearchHistoryEntry } from '../../types/data/SearchHistoryEntry';
import { AbstractFIFOQueue } from '../../types/utils/AbstractFIFOQueue';
import { RedisFIFOQueue } from '../../types/utils/RedisFIFOQueue';

class StatisticsService {
    searchHistory: AbstractFIFOQueue<SearchHistoryEntry>;
    grabHistory: AbstractFIFOQueue<GrabHistoryEntry>;

    constructor() {
        this.searchHistory = new RedisFIFOQueue('search-history', 500);
        this.grabHistory = new RedisFIFOQueue('grab-history', 500);
    }

    addSearch(entry: SearchHistoryEntry): void {
        this.searchHistory.enqueue(entry);
    }

    async getSearchHistory(): Promise<SearchHistoryEntry[]> {
        return await this.searchHistory.getItems();
    }

    async clearSearchHistory(): Promise<void> {
        await this.searchHistory.clear();
    }

    addGrab(entry: GrabHistoryEntry): void {
        this.grabHistory.enqueue(entry);
    }

    async getGrabHistory(): Promise<GrabHistoryEntry[]> {
        return await this.grabHistory.getItems();
    }

    async clearGrabHistory(): Promise<void> {
        await this.grabHistory.clear();
    }
}

export default new StatisticsService();