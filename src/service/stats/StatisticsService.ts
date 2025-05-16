import { GrabHistoryEntry } from '../../types/data/GrabHistoryEntry';
import { SearchHistoryEntry } from '../../types/data/SearchHistoryEntry';
import { AbstractFIFOQueue } from '../../types/utils/AbstractFIFOQueue';
import { RedisFIFOQueue } from '../../types/utils/RedisFIFOQueue';
import RedisCacheService from '../redis/redisCacheService';
import { redis } from '../redis/redisService';

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

    async setUptime(): Promise<void> {
        await redis.set('iplayarr_uptime', new Date().getTime());
    }

    async getUptime(): Promise<number> {
        const uptime = await redis.get('iplayarr_uptime');
        if (uptime) {
            return Date.now() - parseInt(uptime);
        } else {
            return 0;
        }
    }

    async getCacheSizes(): Promise<{ [key: string]: string }> {
        const [search_size, schedule_size] = await Promise.all([RedisCacheService.getCacheSizeInMB(['search_cache_*']), RedisCacheService.getCacheSizeInMB(['schedule_cache_*'])]);

        return {
            search: search_size,
            schedule: schedule_size
        }
    }
}

export default new StatisticsService();