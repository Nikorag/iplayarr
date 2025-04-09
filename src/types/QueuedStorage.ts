import {redis} from '../service/redisService';

export class QueuedStorage {
    private current: Promise<void>;

    constructor() {
        this.current = Promise.resolve(); // Start with a resolved promise
    }

    async values(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.current = this.current.then(async () => {
                try {
                    const keys = await redis.keys('*');
                    const values = await redis.mget(keys);
                    resolve(values.map(value => value ? JSON.parse(value) : undefined));
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async keys(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.current = this.current.then(() =>
                redis.keys('*').then(resolve, reject)
            );
        });
    }

    async getItem(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.current = this.current.then(() => 
                redis.get(key).then((str : string | null) => resolve(str ? JSON.parse(str) : undefined), reject)
            );
        });
    }

    async setItem(key: string, value: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.current = this.current.then(() => 
                redis.set(key, JSON.stringify(value)).then(() => resolve()).catch(reject)
            );
        });
    }

    async removeItem(key: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.current = this.current.then(() => 
                redis.del(key).then(() => resolve()).catch(reject)
            );
        });
    }
}
