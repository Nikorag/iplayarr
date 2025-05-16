import RedisCacheService from '../../src/service/redis/redisCacheService';
import { redis } from '../../src/service/redis/redisService';

jest.mock('../../src/service/redis/redisService', () => ({
    redis: {
        get: jest.fn(),
        keys: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        scan: jest.fn(),
        memory: jest.fn(),
    },
}));
const mockedRedis = jest.mocked(redis);

describe('RedisCacheService', () => {
    const prefix = 'test';
    const ttl = 60;
    const service = new RedisCacheService<{ hello: string }>(prefix, ttl);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('get', () => {
        it('returns parsed value if found', async () => {
            mockedRedis.get.mockResolvedValue(JSON.stringify({ hello: 'world' }));

            const result = await service.get('myKey');

            expect(redis.get).toHaveBeenCalledWith('test_myKey');
            expect(result).toEqual({ hello: 'world' });
        });

        it('returns undefined if value not found', async () => {
            mockedRedis.get.mockResolvedValue(null);

            const result = await service.get('missingKey');

            expect(redis.get).toHaveBeenCalledWith('test_missingKey');
            expect(result).toBeUndefined();
        });

        it('returns undefined if JSON parse throws', async () => {
            mockedRedis.get.mockResolvedValue('invalid json');

            const result = await service.get('badKey');

            expect(redis.get).toHaveBeenCalledWith('test_badKey');
            expect(result).toBeUndefined(); // because it’s caught
        });

        it('returns undefined if redis.get throws', async () => {
            mockedRedis.get.mockRejectedValue(new Error('fail'));

            const result = await service.get('errorKey');

            expect(redis.get).toHaveBeenCalledWith('test_errorKey');
            expect(result).toBeUndefined();
        });
    });

    describe('set', () => {
        it('sets value with correct key and TTL', async () => {
            await service.set('myKey', { hello: 'world' });

            expect(redis.set).toHaveBeenCalledWith('test_myKey', JSON.stringify({ hello: 'world' }), 'EX', ttl);
        });
    });

    describe('del', () => {
        it('deletes key with prefix', async () => {
            await service.del('myKey');

            expect(redis.del).toHaveBeenCalledWith('test_myKey');
        });
    });

    describe('clear', () => {
        it('deletes all keys with prefix', async () => {
            mockedRedis.keys.mockResolvedValue(['test_myKey', 'test_myKey2']);

            await service.clear();

            expect(redis.keys).toHaveBeenCalledWith('test_*');
            expect(redis.del).toHaveBeenCalledWith(['test_myKey', 'test_myKey2']);
        });
    });

    describe('getCacheSizeInMB', () => {

        it('calculates total cache size for multiple patterns', async () => {
            // Simulate scan calls for two patterns
            (redis.scan as jest.Mock)
                // First pattern
                .mockResolvedValueOnce(['1', ['search_cache_1', 'search_cache_2']])
                .mockResolvedValueOnce(['0', []])
                // Second pattern
                .mockResolvedValueOnce(['1', ['schedule_cache_1']])
                .mockResolvedValueOnce(['0', []]);

            // Simulate memory usage for each key
            (redis.memory as jest.Mock)
                .mockResolvedValueOnce(1024 * 1024)  // 1MB
                .mockResolvedValueOnce(512 * 1024)   // 0.5MB
                .mockResolvedValueOnce(256 * 1024);  // 0.25MB

            const size = await RedisCacheService.getCacheSizeInMB(['search_cache_*', 'schedule_cache_*']);
            expect(size).toBe('1.75');

            expect((redis.scan as jest.Mock)).toHaveBeenCalledTimes(4);
            expect((redis.memory as jest.Mock)).toHaveBeenCalledTimes(3);
        });

        it('handles keys being deleted before MEMORY USAGE', async () => {
            (redis.scan as jest.Mock)
                .mockResolvedValueOnce(['0', ['search_cache_1']])
                .mockResolvedValueOnce(['0', []]);

            (redis.memory as jest.Mock).mockRejectedValueOnce(new Error('Key not found'));

            const size = await RedisCacheService.getCacheSizeInMB(['search_cache_*']);
            expect(size).toBe('0.00');

            expect((redis.memory as jest.Mock)).toHaveBeenCalledTimes(1);
        });
    });
});
