import storage from 'node-persist';

import {redis} from '../../service/redisService';

export class QueuedStorage {
    private current: Promise<void>;

    constructor() {
        this.current = Promise.resolve(); // Start with a resolved promise
    }

    // Keep this method to migrate settings
    async init(opts: Record<string, any>): Promise<void> {
        await storage.init(opts);

        const migrationTypes = [
            'history',
            'synonyms',
            'series-cache-definition',
            'config',
            'apps',
        ]

        const rawMigrated : string | null = await redis.get('node-persist-migrated');
        let migrated : string[] = [];
        if (rawMigrated){
            migrated = JSON.parse(rawMigrated) as string[]
        }
        const keys = await storage.keys();
        for (const key of keys.filter((k) => !migrated.includes(k))){
            const value = await storage.getItem(key);
            const redisKey = `${!migrationTypes.includes(key) ? 'offSchedule_' : ''}${key}`
            await redis.set(redisKey, JSON.stringify(value));
            migrated.push(key);
        }

        await redis.set('node-persist-migrated', JSON.stringify(migrated));
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
