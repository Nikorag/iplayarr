import { v4 } from 'uuid';

import { QueuedStorage } from '../types/helpers/QueuedStorage';
import { Entity } from '../types/models/Entity';
import AbstractEntityService from './AbstractEntityService';

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}

export default abstract class AbstractStorageService<T extends Entity> extends AbstractEntityService<string, T> {
    type : string;
    storage : QueuedStorage;
    isStorageInitialized : boolean;

    constructor(type : string){
        super();
        this.type = type;
        this.storage = new QueuedStorage();
        this.isStorageInitialized = false;
    }

    async initStorage() : Promise<void> {
        if (!this.isStorageInitialized) {
            await this.storage.init(storageOptions);
            this.isStorageInitialized = true;
        }
    }

    async getItem(id: string): Promise<T | undefined> {
        const all = await this.all();
        return all.find((item) => item.id == id);
    }

    async setItem(id : string | undefined, value: T): Promise<T> {
        value.id = id ?? v4();
        let all = await this.all();
        all = all.filter(({id}) => id != value.id);
        all.push(value);
        await this.storage.setItem(this.type, all);
        return value;
    }

    async updateItem(id : string | undefined, value: Partial<T>): Promise<T | undefined> {
        if (value.id){
            let existing : T | undefined = await this.getItem(value.id);
            if (existing){
                existing = {
                    ...existing,
                    ...value
                }
                await this.removeItem(value.id)
                await this.setItem(value.id, existing);
                return existing;
            }
        }
        return;
    }

    async removeItem(id: string): Promise<void> {
        let all = await this.all();
        all = all.filter(({id : itemId}) => id != itemId);
        await this.storage.setItem(this.type, all);
    }

    async all(): Promise<T[]> {
        await this.initStorage();
        return (await this.storage.getItem(this.type)) || [];
    }
}