export default abstract class AbstractEntityService<K, T> {
    abstract getItem(id: K): Promise<T | undefined>;
    abstract setItem(id : K | undefined, value: T): Promise<T>;
    abstract updateItem(id : K | undefined, value: Partial<T>): Promise<T | undefined>;
    abstract removeItem(id: K): Promise<void>;
    abstract all(): Promise<T[]>;
}