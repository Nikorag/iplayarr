export interface AbstractFIFOQueue<T> {
    enqueue(item: T): Promise<void>;
    dequeue(): Promise<T | undefined>;
    peek(): Promise<T | undefined>;
    size(): Promise<number>;
    isEmpty(): Promise<boolean>;
    getItems(): Promise<T[]>;
    clear(): Promise<void>;
}