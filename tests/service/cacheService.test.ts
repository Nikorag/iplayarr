import CacheService from '../../server/service/cache/cacheService';

describe('CacheService', () => {
    afterEach(() => jest.restoreAllMocks());

    it('returns undefined for missing keys', async () => {
        expect(await new CacheService('t1', 60).get('nope')).toBeUndefined();
    });

    it('sets and gets copies of values', async () => {
        const cache = new CacheService<{ a: number[] }>('t2', 60);
        const original = { a: [1] };
        await cache.set('k', original);
        original.a.push(2);

        const first = await cache.get('k');
        expect(first).toEqual({ a: [1] });
        first!.a.push(3);
        expect(await cache.get('k')).toEqual({ a: [1] });
    });

    it('expires entries after the ttl', async () => {
        const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
        const cache = new CacheService<string>('t3', 10);
        await cache.set('k', 'v');

        now.mockReturnValue(1000 + 9999);
        expect(await cache.get('k')).toBe('v');
        now.mockReturnValue(1000 + 10000);
        expect(await cache.get('k')).toBeUndefined();
    });

    it('getOr only fetches on a miss', async () => {
        const cache = new CacheService<string>('t4', 60);
        const fetch = jest.fn().mockResolvedValue('fetched');

        expect(await cache.getOr('k', fetch)).toBe('fetched');
        expect(await cache.getOr('k', fetch)).toBe('fetched');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('deletes and clears', async () => {
        const cache = new CacheService<string>('t5', 60);
        await cache.set('a', '1');
        await cache.set('b', '2');
        await cache.del('a');
        expect(await cache.get('a')).toBeUndefined();
        expect(await cache.get('b')).toBe('2');
        await cache.clear();
        expect(await cache.get('b')).toBeUndefined();
    });

    it('reports cache size by prefix', async () => {
        const cache = new CacheService<string>('size_test_cache', 60);
        await cache.set('k', 'x'.repeat(1024 * 1024));

        expect(parseFloat(await CacheService.getCacheSizeInMB(['size_test_cache']))).toBeCloseTo(1, 1);
        expect(await CacheService.getCacheSizeInMB(['unrelated_prefix'])).toBe('0.00');
    });
});

describe('CacheService with Redis (REDIS_HOST set)', () => {
    const env = { ...process.env };
    let cache: CacheService<{ a: number }>;

    beforeAll(() => {
        process.env.REDIS_HOST = 'localhost';
        jest.resetModules();
    });
    afterAll(() => {
        process.env = { ...env };
    });

    it('stores entries in Redis under <prefix>_<key> with a ttl', async () => {
        jest.isolateModules(() => {
            jest.doMock('ioredis', () => jest.requireActual('ioredis-mock'));
        });
        const { default: Cache } = await import('../../server/service/cache/cacheService');
        const { getRedisClient } = await import('../../server/service/cache/redisClient');
        cache = new Cache('redis_t', 60);

        await cache.set('k', { a: 1 });

        expect(await getRedisClient().get('redis_t_k')).toBe('{"a":1}');
        expect(await getRedisClient().ttl('redis_t_k')).toBeGreaterThan(0);
        expect(await cache.get('k')).toEqual({ a: 1 });

        await cache.del('k');
        expect(await cache.get('k')).toBeUndefined();

        await cache.set('x', { a: 2 });
        await cache.clear();
        expect(await cache.get('x')).toBeUndefined();
    });
});
