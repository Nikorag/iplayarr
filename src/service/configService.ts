import dotenv from 'dotenv'

import { QueuedStorage } from '../types/helpers/QueuedStorage'
const storage : QueuedStorage = new QueuedStorage();

import { IplayarrParameter } from '../types/enums/IplayarrParameters';
import AbstractExposedService from './abstractExposedService';

dotenv.config();

let isStorageInitialized : boolean = false;

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}


export interface ConfigMap {
    [key: string] : string
}

async function getConfigMap() : Promise<ConfigMap> {
    if (!isStorageInitialized) {
        await storage.init(storageOptions);
        isStorageInitialized = true;
    }
    return (await storage.getItem('config')) || {};
}

const defaultConfigMap : ConfigMap = {
    'DEBUG' : 'false',
    'ACTIVE_LIMIT' : '3',
    'REFRESH_SCHEDULE' : '0 * * * *',
    'AUTH_USERNAME' : 'admin',
    'AUTH_PASSWORD' : '5f4dcc3b5aa765d61d8327deb882cf99',
    'FALLBACK_FILENAME_SUFFIX' : 'WEB.H264-BBC',
    'MOVIE_FILENAME_TEMPLATE' : '{{#if synonym}}{{synonym}}{{else}}{{title}}{{/if}}.BBC.WEB-DL.AAC.2.0.{{quality}}.H.264',
    'TV_FILENAME_TEMPLATE' : '{{#if synonym}}{{synonym}}{{else}}{{title}}{{/if}}.S{{season}}E{{episode}}.WEB.{{quality}}.H.264.BBC',
    'VIDEO_QUALITY' : 'hd'
};

class ConfigService extends AbstractExposedService<IplayarrParameter, string> {
    defaultConfigMap : ConfigMap = defaultConfigMap;
    async getItem(parameter: IplayarrParameter): Promise<string | undefined> {
        const configMap = await getConfigMap();
        return configMap[parameter.toString()] || process.env[parameter.toString()] || defaultConfigMap[parameter.toString()];
    }
    async setItem(parameter: IplayarrParameter | undefined, value: string): Promise<string> {
        if (parameter){
            const configMap = await getConfigMap();
            configMap[parameter] = value;
            await storage.setItem('config', configMap);
        }
        return value;
    }
    async updateItem(id: IplayarrParameter, value: string): Promise<string | undefined> {
        return this.setItem(id, value);
    }
    async removeItem(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    async all(): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    async getAllConfig() : Promise<ConfigMap> {
        const configMap : ConfigMap = {};
        for (const param of Object.values(IplayarrParameter)){
            const parameter : string | undefined = await this.getItem(param);
            if (parameter){
                configMap[param] = parameter;
            }
        }
        return configMap;
    }
}

export default new ConfigService();
