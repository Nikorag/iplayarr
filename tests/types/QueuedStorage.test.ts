import { SqliteDriver } from '../../server/db/sqliteDriver';
import { QueuedStorage } from '../../server/types/QueuedStorage';

let driver: SqliteDriver;

jest.mock('../../server/db/database', () => ({ getDatabase: () => Promise.resolve(driver) }));

describe('QueuedStorage', () => {
    let storage: QueuedStorage;

    beforeEach(() => {
        driver = new SqliteDriver(':memory:', 'drizzle/sqlite');
        storage = new QueuedStorage();
    });

    afterEach(() => driver.close());

    it('stores and retrieves JSON values', async () => {
        await storage.setItem('config', { a: 1 });
        expect(await storage.getItem('config')).toEqual({ a: 1 });
    });

    it('returns undefined for missing keys', async () => {
        expect(await storage.getItem('missing')).toBeUndefined();
    });

    it('overwrites existing values', async () => {
        await storage.setItem('k', 1);
        await storage.setItem('k', 2);
        expect(await storage.getItem('k')).toBe(2);
    });

    it('lists keys and values', async () => {
        await storage.setItem('key1', { a: 1 });
        await storage.setItem('key2', { b: 2 });

        expect((await storage.keys()).sort()).toEqual(['key1', 'key2']);
        expect(await storage.values()).toEqual(expect.arrayContaining([{ a: 1 }, { b: 2 }]));
    });

    it('removes items', async () => {
        await storage.setItem('key1', 'x');
        await storage.removeItem('key1');
        expect(await storage.getItem('key1')).toBeUndefined();
    });

    it('applies un-awaited operations in order', async () => {
        storage.setItem('k', 'first');
        storage.setItem('k', 'second');
        storage.removeItem('k');
        storage.setItem('k', 'last');
        expect(await storage.getItem('k')).toBe('last');
    });
});
