import RedisCacheService from 'src/service/redisCacheService';
import { redis } from 'src/service/redisService';

jest.mock('src/service/redisService', () => ({
    redis: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    },
}));

describe('RedisCacheService', () => {
    const prefix = 'test';
    const ttl = 60;
    const service = new RedisCacheService<{ hello: string }>(prefix, ttl);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('get', () => {
        it('returns parsed value if found', async () => {
            (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ hello: 'world' }));

            const result = await service.get('myKey');

            expect(redis.get).toHaveBeenCalledWith('test_myKey');
            expect(result).toEqual({ hello: 'world' });
        });

        it('returns undefined if value not found', async () => {
            (redis.get as jest.Mock).mockResolvedValue(null);

            const result = await service.get('missingKey');

            expect(redis.get).toHaveBeenCalledWith('test_missingKey');
            expect(result).toBeUndefined();
        });

        it('returns undefined if JSON parse throws', async () => {
            (redis.get as jest.Mock).mockResolvedValue('invalid json');

            const result = await service.get('badKey');

            expect(redis.get).toHaveBeenCalledWith('test_badKey');
            expect(result).toBeUndefined(); // because it’s caught
        });

        it('returns undefined if redis.get throws', async () => {
            (redis.get as jest.Mock).mockRejectedValue(new Error('fail'));

            const result = await service.get('errorKey');

            expect(redis.get).toHaveBeenCalledWith('test_errorKey');
            expect(result).toBeUndefined();
        });
    });

    describe('set', () => {
        it('sets value with correct key and TTL', async () => {
            await service.set('myKey', { hello: 'world' });

            expect(redis.set).toHaveBeenCalledWith(
                'test_myKey',
                JSON.stringify({ hello: 'world' }),
                'EX',
                ttl
            );
        });
    });

    describe('del', () => {
        it('deletes key with prefix', async () => {
            await service.del('myKey');

            expect(redis.del).toHaveBeenCalledWith('test_myKey');
        });
    });
});
