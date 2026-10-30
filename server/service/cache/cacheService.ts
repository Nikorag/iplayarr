import { getRedisClient, isRedisCacheEnabled } from './redisClient';

interface CacheEntry {
    json: string;
    expiresAt: number;
}

const instances = new Set<CacheService<any>>();

setInterval(() => instances.forEach((cache) => cache.purgeExpired()), 60 * 1000).unref();

/**
 * TTL cache. Held in-process by default; if REDIS_HOST is set it's stored in that Redis instead
 * (keys are `<prefix>_<key>`), so it's shared and survives restarts.
 * Values are stored serialised so callers always get a fresh copy and sizes are cheap to report.
 */
export default class CacheService<T> {
    prefix: string;
    ttl: number;
    private entries = new Map<string, CacheEntry>();

    constructor(prefix: string, ttl: number) {
        this.prefix = prefix;
        this.ttl = ttl;
        instances.add(this);
    }

    async getOr(key: string, fetchFunction: (key: string) => Promise<T>): Promise<T> {
        const cached = await this.get(key);
        if (cached) {
            return cached;
        } else {
            const value = await fetchFunction(key);
            await this.set(key, value);
            return value;
        }
    }

    async get(key: string): Promise<T | undefined> {
        if (isRedisCacheEnabled()) {
            try {
                const data = await getRedisClient().get(`${this.prefix}_${key}`);
                return data != null ? (JSON.parse(data) as T) : undefined;
            } catch {
                return undefined;
            }
        }
        const entry = this.entries.get(key);
        if (!entry) {
            return undefined;
        }
        if (entry.expiresAt <= Date.now()) {
            this.entries.delete(key);
            return undefined;
        }
        return JSON.parse(entry.json) as T;
    }

    async set(key: string, value: T): Promise<void> {
        const json = JSON.stringify(value);
        if (isRedisCacheEnabled()) {
            if (json !== undefined) {
                await getRedisClient().set(`${this.prefix}_${key}`, json, 'EX', this.ttl);
            }
            return;
        }
        if (json === undefined) {
            this.entries.delete(key);
            return;
        }
        this.entries.set(key, { json, expiresAt: Date.now() + this.ttl * 1000 });
    }

    async del(key: string): Promise<void> {
        if (isRedisCacheEnabled()) {
            await getRedisClient().del(`${this.prefix}_${key}`);
            return;
        }
        this.entries.delete(key);
    }

    async clear(): Promise<void> {
        if (isRedisCacheEnabled()) {
            const keys = await getRedisClient().keys(`${this.prefix}_*`);
            if (keys.length) {
                await getRedisClient().del(keys);
            }
            return;
        }
        this.entries.clear();
    }

    purgeExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.entries) {
            if (entry.expiresAt <= now) {
                this.entries.delete(key);
            }
        }
    }

    private sizeInBytes(): number {
        let total = 0;
        for (const [key, entry] of this.entries) {
            total += Buffer.byteLength(key) + Buffer.byteLength(entry.json);
        }
        return total;
    }

    /** Approximate size in MB of every cache whose prefix starts with one of the given prefixes. */
    static async getCacheSizeInMB(prefixes: string[]): Promise<string> {
        let totalBytes = 0;

        if (isRedisCacheEnabled()) {
            const redis = getRedisClient();
            for (const prefix of prefixes) {
                let cursor = '0';
                do {
                    const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}_*`, 'COUNT', 100);
                    cursor = newCursor;
                    const sizes = await Promise.all(keys.map((key) => redis.memory('USAGE', key).catch(() => 0)));
                    totalBytes += sizes.reduce((sum: number, size) => sum + (size || 0), 0);
                } while (cursor !== '0');
            }
            return (totalBytes / (1024 * 1024)).toFixed(2);
        }

        for (const cache of instances) {
            if (prefixes.some((prefix) => cache.prefix.startsWith(prefix))) {
                totalBytes += cache.sizeInBytes();
            }
        }
        return (totalBytes / (1024 * 1024)).toFixed(2);
    }
}
