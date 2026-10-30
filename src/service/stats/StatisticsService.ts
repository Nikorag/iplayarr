import { GrabHistoryEntry } from '../../types/data/GrabHistoryEntry';
import { SearchHistoryEntry } from '../../types/data/SearchHistoryEntry';
import { AbstractFIFOQueue } from '../../types/utils/AbstractFIFOQueue';
import { DatabaseFIFOQueue } from '../../types/utils/DatabaseFIFOQueue';
import CacheService from '../cache/cacheService';

class StatisticsService {
    searchHistory: AbstractFIFOQueue<SearchHistoryEntry>;
    grabHistory: AbstractFIFOQueue<GrabHistoryEntry>;
    private startedAt = 0;

    constructor() {
        this.searchHistory = new DatabaseFIFOQueue('search-history', 500);
        this.grabHistory = new DatabaseFIFOQueue('grab-history', 500);
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

    async setUptime(): Promise<void> {
        this.startedAt = Date.now();
    }

    async getUptime(): Promise<number> {
        return this.startedAt ? Date.now() - this.startedAt : 0;
    }

    async getCacheSizes(): Promise<{ [key: string]: string }> {
        const [search_size, schedule_size] = await Promise.all([CacheService.getCacheSizeInMB(['search_cache']), CacheService.getCacheSizeInMB(['schedule_cache'])]);

        return {
            search: search_size,
            schedule: schedule_size
        }
    }
}

export default new StatisticsService();