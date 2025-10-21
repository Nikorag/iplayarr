import { redis } from './redisService';

export default class RedisCacheService<T> {
    prefix: string;
    ttl: number;

    constructor(prefix: string, ttl: number) {
        this.prefix = prefix;
        this.ttl = ttl;
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

    get(key: string): Promise<T | undefined> {
        return new Promise((resolve) => {
            redis
                .get(`${this.prefix}_${key}`)
                .then((data) => {
                    if (data != null) {
                        resolve(JSON.parse(data) as T);
                    } else {
                        resolve(undefined);
                    }
                })
                .catch(() => resolve(undefined));
        });
    }

    async set(key: string, value: T): Promise<void> {
        await redis.set(`${this.prefix}_${key}`, JSON.stringify(value), 'EX', this.ttl);
    }

    async del(key: string): Promise<void> {
        await redis.del(`${this.prefix}_${key}`);
    }

    async clear(): Promise<void> {
        const keys = await redis.keys(`${this.prefix}_*`);
        if (keys.length) {
            await redis.del(keys);
        }
    }

    static async getCacheSizeInMB(patterns: string[]): Promise<string> {
        let totalBytes = 0;

        for (const pattern of patterns) {
            let cursor = '0';

            do {
                const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = newCursor;

                if (keys.length > 0) {
                    const sizes = await Promise.all(
                        keys.map(key => redis.memory('USAGE', key).catch(() => 0))
                    );
                    totalBytes += sizes.reduce((sum: any, size) => sum + (size || 0), 0);
                }
            } while (cursor !== '0');
        }

        const totalMB = totalBytes / (1024 * 1024);
        return totalMB.toFixed(2);
    }
}
