import dotenv from 'dotenv'
import storage from 'node-persist';

import { IplayarrParameter } from '../types/IplayarrParameters';

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

const configService = {
    getAllConfig : async () : Promise<ConfigMap> =>  {
        const configMap : ConfigMap = {};
        for (const param of Object.values(IplayarrParameter)){
            const parameter : string | undefined = await configService.getParameter(param);
            if (parameter){
                configMap[param] = parameter;
            }
        }
        return configMap;
    },

    defaultConfigMap : {
        'DEBUG' : 'false',
        'ACTIVE_LIMIT' : '3',
        'REFRESH_SCHEDULE' : '0 * * * *',
        'AUTH_USERNAME' : 'admin',
        'AUTH_PASSWORD' : '5f4dcc3b5aa765d61d8327deb882cf99',
        'FALLBACK_FILENAME_SUFFIX' : 'WEB.H264-BBC',
        'MOVIE_FILENAME_TEMPLATE' : '{{title}}.BBC.WEB-DL.AAC.2.0.{{quality}}.H.264',
        'TV_FILENAME_TEMPLATE' : '{{title}}.S{{season}}E{{episode}}.WEB.{{quality}}.H.264.BBC',
        'VIDEO_QUALITY' : 'hd'
    } as ConfigMap,

    getParameter : async (parameter: IplayarrParameter): Promise<string | undefined> => {
        const configMap = await getConfigMap();
        return configMap[parameter.toString()] || process.env[parameter.toString()] || configService.defaultConfigMap[parameter.toString()];
    },

    setParameter : async (parameter: IplayarrParameter, value : string) : Promise<void> => {
        const configMap = await getConfigMap();
        configMap[parameter] = value;
        await storage.setItem('config', configMap);
    },

    removeParameter : async (parameter: IplayarrParameter) : Promise<void> => {
        const configMap = await getConfigMap();
        delete configMap[parameter];
        await storage.setItem('config', configMap);
    },

    resetConfigService : () => {
        isStorageInitialized = false;
    }
}

export default configService;