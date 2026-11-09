import { getDatabase } from '../db/database';

/**
 * Persistent JSON key/value storage backed by the configured database (SQLite or Postgres).
 * Operations run one at a time, in the order they were issued.
 */
export class QueuedStorage {
    private current: Promise<unknown> = Promise.resolve();

    private enqueue<R>(operation: () => Promise<R>): Promise<R> {
        const result = this.current.then(operation);
        this.current = result.catch(() => undefined);
        return result;
    }

    async values(): Promise<any[]> {
        return this.enqueue(async () => {
            const entries = await (await getDatabase()).kvEntries();
            return entries.map(({ value }) => JSON.parse(value));
        });
    }

    async keys(): Promise<string[]> {
        return this.enqueue(async () => (await (await getDatabase()).kvEntries()).map(({ key }) => key));
    }

    async getItem(key: string): Promise<any> {
        return this.enqueue(async () => {
            const value = await (await getDatabase()).kvGet(key);
            return value ? JSON.parse(value) : undefined;
        });
    }

    async setItem(key: string, value: any): Promise<void> {
        return this.enqueue(async () => (await getDatabase()).kvSet(key, JSON.stringify(value)));
    }

    async removeItem(key: string): Promise<void> {
        return this.enqueue(async () => (await getDatabase()).kvDelete(key));
    }
}
