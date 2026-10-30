import { getDatabase } from '../../db/database';
import { AbstractFIFOQueue } from './AbstractFIFOQueue';

/** Capped FIFO queue persisted in the database. getItems() returns newest first. */
export class DatabaseFIFOQueue<T> implements AbstractFIFOQueue<T> {
    private name: string;
    private maxSize: number;

    constructor(name: string, maxSize: number) {
        this.name = name;
        this.maxSize = maxSize;
    }

    async enqueue(item: T): Promise<void> {
        await (await getDatabase()).queueAppend(this.name, JSON.stringify(item), this.maxSize);
    }

    async dequeue(): Promise<T | undefined> {
        const item = await (await getDatabase()).queueShiftOldest(this.name);
        return item ? (JSON.parse(item) as T) : undefined;
    }

    async peek(): Promise<T | undefined> {
        const item = await (await getDatabase()).queuePeekOldest(this.name);
        return item ? (JSON.parse(item) as T) : undefined;
    }

    async size(): Promise<number> {
        return (await getDatabase()).queueSize(this.name);
    }

    async isEmpty(): Promise<boolean> {
        return (await getDatabase()).queueIsEmpty(this.name);
    }

    async getItems(): Promise<T[]> {
        const items = await (await getDatabase()).queueItems(this.name);
        return items.map((item) => JSON.parse(item) as T);
    }

    async clear(): Promise<void> {
        await (await getDatabase()).queueClear(this.name);
    }
}
