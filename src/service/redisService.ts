import Redis, { RedisOptions } from 'ioredis';

const redisOptions : RedisOptions = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    tls: process.env.REDIS_SSL === 'true' ? {} : undefined
}

if (process.env.REDIS_PASSWORD){
    redisOptions.password = process.env.REDIS_PASSWORD
}

export const redis = new Redis(redisOptions);