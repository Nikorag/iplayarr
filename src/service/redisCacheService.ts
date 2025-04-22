import {redis} from './redisService';

export default class RedisCacheService<T> {
    prefix : string
    ttl : number

    constructor(prefix : string, ttl : number){
        this.prefix = prefix;
        this.ttl = ttl;
    }

    get(key : string) : Promise<T | undefined> {
        return new Promise((resolve) => {
            redis.get(`${this.prefix}_${key}`).then((data) => {
                if (data != null){
                    resolve(JSON.parse(data) as T);
                } else {
                    resolve(undefined);
                }
            }).catch(() => resolve(undefined));
        })
    }

    async set(key : string, value : T) : Promise<void> {
        await redis.set(`${this.prefix}_${key}`, JSON.stringify(value), 'EX', this.ttl);
    }

    async del(key : string) : Promise<void> {
        await redis.del(`${this.prefix}_${key}`);
    }

    async clear() : Promise<void> {
        const keys = await redis.keys(`${this.prefix}_*`);
        if (keys.length) {
            await redis.del(keys);
        }
    }
}