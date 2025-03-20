export default abstract class AbstractExposedService<T> {
    abstract getItem(id: string): Promise<T | undefined>;
    abstract setItem(value: T): Promise<T>;
    abstract updateItem(value: Partial<T>): Promise<T | undefined>;
    abstract removeItem(id: string): Promise<void>;
    abstract all(): Promise<T[]>;
}