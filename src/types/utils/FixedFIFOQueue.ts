import { AbstractFIFOQueue } from './AbstractFIFOQueue';

export class FixedFIFOQueue<T> implements AbstractFIFOQueue<T> {
    private queue: T[] = [];
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    async clear(): Promise<void> {
        this.queue = [];
    }

    async enqueue(item: T): Promise<void> {
        if (this.queue.length >= this.maxSize) {
            this.queue.shift(); // Remove the oldest item
        }
        this.queue.push(item);
    }

    async dequeue(): Promise<T | undefined> {
        return this.queue.shift(); // Remove and return the oldest item
    }

    async peek(): Promise<T | undefined> {
        return this.queue[0]; // Check the oldest item without removing it
    }

    async size(): Promise<number> {
        return this.queue.length;
    }

    async isEmpty(): Promise<boolean> {
        return this.queue.length === 0;
    }

    async getItems(): Promise<T[]> {
        return [...this.queue]; // Return a copy of the queue
    }
}
