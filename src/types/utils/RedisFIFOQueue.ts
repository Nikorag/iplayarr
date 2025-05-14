import { redis } from '../../service/redis/redisService'
import { AbstractFIFOQueue } from './AbstractFIFOQueue';

export class RedisFIFOQueue<T> implements AbstractFIFOQueue<T> {
    private key: string;
    private maxSize: number;

    constructor(key: string, maxSize: number) {
        this.key = key;
        this.maxSize = maxSize;
    }

    async enqueue(item: T): Promise<void> {
        const serialized = JSON.stringify(item);
        await redis.lpush(this.key, serialized);
        await redis.ltrim(this.key, 0, this.maxSize - 1);
    }

    async dequeue(): Promise<T | undefined> {
        const item = await redis.rpop(this.key);
        return item ? (JSON.parse(item) as T) : undefined;
    }

    async peek(): Promise<T | undefined> {
        const item = await redis.lindex(this.key, -1);
        return item ? (JSON.parse(item) as T) : undefined;
    }

    async size(): Promise<number> {
        return redis.llen(this.key);
    }

    async isEmpty(): Promise<boolean> {
        return (await this.size()) === 0;
    }

    async getItems(): Promise<T[]> {
        const items = await redis.lrange(this.key, 0, -1);
        return items.map((item) => JSON.parse(item) as T);
    }

    async clear(): Promise<void> {
        await redis.del(this.key);
    }
}
