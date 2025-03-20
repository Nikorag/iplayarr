import { v4 } from 'uuid';

import { QueuedStorage } from '../shared/types/helpers/QueuedStorage';
import { AbstractStoredType } from '../shared/types/models/AbstractStoredType';
import AbstractExposedService from './abstractExposedService';

const storage : QueuedStorage = new QueuedStorage();
let isStorageInitialized : boolean = false;

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}

export default abstract class AbstractStorageService<T extends AbstractStoredType> extends AbstractExposedService<T> {
    type : string;

    constructor(type : string){
        super();
        this.type = type;
    }

    async initStorage() : Promise<void> {
        if (!isStorageInitialized) {
            await storage.init(storageOptions);
            isStorageInitialized = true;
        }
    }

    async getItem(id: string): Promise<T | undefined> {
        const all = await this.all();
        return all.find((item) => item.id == id);
    }

    async setItem(value: T): Promise<T> {
        if (!value.id){
            value.id = v4();
        }
        let all = await this.all();
        all = all.filter(({id}) => id != value.id);
        all.push(value);
        await storage.setItem(this.type, all);
        return value;
    }

    async updateItem(value: Partial<T>): Promise<T | undefined> {
        if (value.id){
            let existing : T | undefined = await this.getItem(value.id);
            if (existing){
                existing = {
                    ...existing,
                    ...value
                }
                await this.removeItem(value.id)
                await this.setItem(existing);
                return existing;
            }
        }
        return;
    }

    async removeItem(id: string): Promise<void> {
        let all = await this.all();
        all = all.filter(({id : itemId}) => id != itemId);
        await storage.setItem(this.type, all);
    }

    async all(): Promise<T[]> {
        await this.initStorage();
        return (await storage.getItem(this.type)) || [];
    }
}