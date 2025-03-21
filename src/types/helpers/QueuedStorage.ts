import storage from 'node-persist';

export class QueuedStorage {
    private current: Promise<void>;

    constructor() {
        this.current = Promise.resolve(); // Start with a resolved promise
    }

    async init(opts: Record<string, any>): Promise<void> {
        await storage.init(opts);
    }

    async values(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.current = this.current.then(() =>
                storage.values().then(resolve, reject)
            );
        });
    }

    async getItem(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.current = this.current.then(() => 
                storage.getItem(key).then(resolve, reject)
            );
        });
    }

    async setItem(key: string, value: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.current = this.current.then(() => 
                storage.setItem(key, value).then(() => resolve()).catch(reject)
            );
        });
    }
}
