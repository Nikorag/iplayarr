import dotenv from 'dotenv'

import { IplayarrParameter } from '../types/IplayarrParameters';
import { QueuedStorage } from '../types/QueuedStorage'


dotenv.config();

const storage : QueuedStorage = new QueuedStorage();


export interface ConfigMap {
    [key: string] : string
}

async function getConfigMap() : Promise<ConfigMap> {
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
        'MOVIE_FILENAME_TEMPLATE' : '{{#if synonym}}{{synonym}}{{else}}{{title}}{{/if}}.BBC.WEB-DL.AAC.2.0.{{quality}}.H.264',
        'TV_FILENAME_TEMPLATE' : '{{#if synonym}}{{synonym}}{{else}}{{title}}{{/if}}.S{{season}}E{{episode}}.WEB.{{quality}}.H.264.BBC',
        'VIDEO_QUALITY' : 'hd',
        'RSS_FEED_HOURS' : '48',
        'NATIVE_SEARCH' : 'true',
        'ARCHIVE_ENABLED' : 'false'
    } as ConfigMap,

    getParameter : async (parameter: IplayarrParameter): Promise<string | undefined> => {
        const configMap = await getConfigMap();
        return configMap[parameter.toString()] || process.env[parameter.toString()] || configService.defaultConfigMap[parameter.toString()];
    },

    getParameters : async (...parameters : IplayarrParameter[]): Promise<(string | undefined)[]> => {
        return await Promise.all(parameters.map(configService.getParameter));
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
    }
}

export default configService;
