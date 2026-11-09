import { SqliteDriver } from '../../server/db/sqliteDriver';
import sessionService from '../../server/service/auth/sessionService';
import { DatabaseFIFOQueue } from '../../server/types/utils/DatabaseFIFOQueue';

let driver: SqliteDriver;

jest.mock('../../server/db/database', () => ({ getDatabase: () => Promise.resolve(driver) }));

beforeEach(() => {
    driver = new SqliteDriver(':memory:', 'drizzle/sqlite');
});
afterEach(() => driver.close());

describe('SqliteDriver', () => {
    it('inserts only missing kv keys', async () => {
        expect(await driver.kvInsertIfMissing('k', '1')).toBe(true);
        expect(await driver.kvInsertIfMissing('k', '2')).toBe(false);
        expect(await driver.kvGet('k')).toBe('1');
    });

    it('ignores expired sessions', async () => {
        await driver.sessionSet('live', '{}', Date.now() + 10000);
        await driver.sessionSet('dead', '{}', Date.now() - 1);
        expect(await driver.sessionGet('live')).toBe('{}');
        expect(await driver.sessionGet('dead')).toBeUndefined();
    });

    it('stores meta values and pings', async () => {
        await driver.metaSet('m', 'v');
        expect(await driver.metaGet('m')).toBe('v');
        await expect(driver.ping()).resolves.toBeUndefined();
    });
});

describe('DatabaseFIFOQueue', () => {
    it('caps the queue and returns items newest first', async () => {
        const queue = new DatabaseFIFOQueue<number>('q', 3);
        for (let i = 1; i <= 5; i++) await queue.enqueue(i);

        expect(await queue.getItems()).toEqual([5, 4, 3]);
        expect(await queue.size()).toBe(3);
        expect(await queue.peek()).toBe(3);
    });

    it('dequeues the oldest item and keeps queues separate', async () => {
        const a = new DatabaseFIFOQueue<string>('a', 10);
        const b = new DatabaseFIFOQueue<string>('b', 10);
        await a.enqueue('1');
        await a.enqueue('2');
        await b.enqueue('x');

        expect(await a.dequeue()).toBe('1');
        expect(await a.getItems()).toEqual(['2']);
        expect(await b.getItems()).toEqual(['x']);
        await a.clear();
        expect(await a.isEmpty()).toBe(true);
        expect(await b.isEmpty()).toBe(false);
        expect(await a.dequeue()).toBeUndefined();
    });
});

describe('sessionService', () => {
    it('stores, loads and removes sessions', async () => {
        await sessionService.store('sid1', { user: { username: 'admin' } });
        expect((await sessionService.load('sid1'))?.user).toEqual({ username: 'admin' });

        await sessionService.remove('sid1');
        expect(await sessionService.load('sid1')).toBeUndefined();
    });
});
