import RedisMock from 'ioredis-mock';

import { SqliteDriver } from '../../src/db/sqliteDriver';
import { importFromRedis, migrateFromRedisIfNeeded, MIGRATION_MARKER } from '../../src/migration/redisMigrationService';

let driver: SqliteDriver;

jest.mock('../../src/db/database', () => ({ getDatabase: () => Promise.resolve(driver) }));

describe('redis migration', () => {
    let redis: InstanceType<typeof RedisMock>;
    const env = { ...process.env };

    beforeEach(async () => {
        driver = new SqliteDriver(':memory:', 'drizzle/sqlite');
        redis = new RedisMock();
        await redis.flushall();
    });

    afterEach(() => {
        process.env = { ...env };
        return driver.close();
    });

    it('imports key/values, sessions and history, skipping caches', async () => {
        await redis.set('config', JSON.stringify({ DEBUG: 'true' }));
        await redis.set('apps', JSON.stringify([{ id: 1 }]));
        await redis.set('offSchedule_doctor who', JSON.stringify({ results: [], url: 'u' }));
        await redis.set('not-json', '{oops');
        await redis.set('search_cache_foo', JSON.stringify([1]));
        await redis.set('metadata_cache_p1', JSON.stringify({}));
        await redis.set('iplayarr_uptime', '123');
        await redis.rpush('iplayarr_logs', '{}');
        await redis.set('iplayarr:sid-live', JSON.stringify({ user: { username: 'admin' } }), 'EX', 600);
        // lpush => newest first, as the old RedisFIFOQueue did
        await redis.lpush('search-history', JSON.stringify({ term: 'old' }));
        await redis.lpush('search-history', JSON.stringify({ term: 'new' }));

        const result = await importFromRedis(redis as any, driver);

        expect(result).toEqual({ keyValues: 3, sessions: 1, queueEntries: 2, skipped: 1 });
        expect(JSON.parse((await driver.kvGet('config'))!)).toEqual({ DEBUG: 'true' });
        expect(await driver.kvGet('search_cache_foo')).toBeUndefined();
        expect((await driver.kvEntries()).map((e) => e.key).sort()).toEqual(['apps', 'config', 'offSchedule_doctor who']);
        expect(await driver.sessionGet('sid-live')).toBeDefined();
        expect((await driver.queueItems('search-history')).map((i) => JSON.parse(i).term)).toEqual(['new', 'old']);
    });

    it('never overwrites data that already exists', async () => {
        await driver.kvSet('config', JSON.stringify({ DEBUG: 'false' }));
        await redis.set('config', JSON.stringify({ DEBUG: 'true' }));

        await importFromRedis(redis as any, driver);

        expect(JSON.parse((await driver.kvGet('config'))!)).toEqual({ DEBUG: 'false' });
    });

    it('does nothing on a fresh install', async () => {
        process.env.REDIS_DATA_DIR = '/nonexistent';
        delete process.env.REDIS_HOST;
        const log = jest.fn();

        await migrateFromRedisIfNeeded(log);

        expect(log).not.toHaveBeenCalled();
        expect(await driver.metaGet(MIGRATION_MARKER)).toBeUndefined();
    });

    it('skips when already migrated or explicitly disabled', async () => {
        process.env.REDIS_HOST = 'unreachable.invalid';
        process.env.SKIP_REDIS_MIGRATION = 'true';
        await expect(migrateFromRedisIfNeeded(jest.fn())).resolves.toBeUndefined();

        delete process.env.SKIP_REDIS_MIGRATION;
        await driver.metaSet(MIGRATION_MARKER, '{}');
        await expect(migrateFromRedisIfNeeded(jest.fn())).resolves.toBeUndefined();
    });

    it('fails loudly, leaving no marker, when the configured Redis is unreachable', async () => {
        process.env.REDIS_HOST = '127.0.0.1';
        process.env.REDIS_PORT = '1';
        process.env.REDIS_MIGRATION_RETRY_MS = '1';

        await expect(migrateFromRedisIfNeeded(jest.fn())).rejects.toThrow(/Could not migrate existing data/);

        expect(await driver.metaGet(MIGRATION_MARKER)).toBeUndefined();
    });
});
