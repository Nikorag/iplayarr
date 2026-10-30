/** A map-backed stand-in for CacheService that tests can reset between cases */
export const memoryCaches: Map<string, any>[] = [];

export class MemoryCache<T> {
    private entries = new Map<string, T>();

    constructor() {
        memoryCaches.push(this.entries);
    }

    async get(key: string) {
        return this.entries.get(key);
    }

    async set(key: string, value: T) {
        this.entries.set(key, value);
    }

    async getOr(key: string, fetch: (key: string) => Promise<T>) {
        if (!this.entries.has(key)) {
            this.entries.set(key, await fetch(key));
        }
        return this.entries.get(key) as T;
    }
}

export const clearMemoryCaches = () => memoryCaches.forEach((entries) => entries.clear());
