import type { RedisOptions } from 'ioredis';

jest.mock('ioredis', () => {
    return jest.fn().mockImplementation((options: RedisOptions) => {
        return {
            options,
            connect: jest.fn(),
        };
    });
});

describe('Redis Client Initialization', () => {
    beforeEach(() => {
        jest.resetModules(); // Clear import cache

        // Reset env variables
        delete process.env.REDIS_HOST;
        delete process.env.REDIS_PORT;
        delete process.env.REDIS_SSL;
        delete process.env.REDIS_PASSWORD;
    });

    it('should create Redis client with default options', async () => {
        process.env.REDIS_SSL = 'false';

        const { redis } = await import('../../src/service/redisService');
        const Redis = (await import('ioredis')).default;

        expect(Redis).toHaveBeenCalledWith({
            host: '127.0.0.1',
            port: 6379,
            tls: undefined,
        });
        expect(redis.options).toEqual({
            host: '127.0.0.1',
            port: 6379,
            tls: undefined,
        });
    });

    it('should use custom host and port from env', async () => {
        process.env.REDIS_HOST = 'myhost';
        process.env.REDIS_PORT = '6380';
        process.env.REDIS_SSL = 'false';

        const { redis } = await import('../../src/service/redisService');
        const Redis = (await import('ioredis')).default;

        expect(Redis).toHaveBeenCalledWith({
            host: 'myhost',
            port: 6380,
            tls: undefined,
        });
        expect(redis.options).toEqual({
            host: 'myhost',
            port: 6380,
            tls: undefined,
        });
    });

    it('should enable TLS if REDIS_SSL is true', async () => {
        process.env.REDIS_SSL = 'true';

        await import('../../src/service/redisService');
        const Redis = (await import('ioredis')).default;

        expect(Redis).toHaveBeenCalledWith(expect.objectContaining({ tls: {} }));
    });

    it('should set password if REDIS_PASSWORD is provided', async () => {
        process.env.REDIS_PASSWORD = 'secret';
        process.env.REDIS_SSL = 'false';

        await import('../../src/service/redisService');
        const Redis = (await import('ioredis')).default;

        expect(Redis).toHaveBeenCalledWith(
            expect.objectContaining({
                password: 'secret',
            })
        );
    });
});
