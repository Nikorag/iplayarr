import Redis, { RedisOptions } from 'ioredis';

/** Redis is optional: it's used as the shared cache only when REDIS_HOST is set. */
export const isRedisCacheEnabled = (): boolean => !!process.env.REDIS_HOST;

let client: Redis | undefined;

export function getRedisClient(): Redis {
    if (!client) {
        const options: RedisOptions = {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
            tls: process.env.REDIS_SSL === 'true' ? {} : undefined,
        };
        if (process.env.REDIS_PASSWORD) {
            options.password = process.env.REDIS_PASSWORD;
        }
        client = new Redis(options);
        client.on('error', () => undefined); // cache failures degrade to cache misses
    }
    return client;
}
