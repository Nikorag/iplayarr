import storage from 'node-persist';
import dotenv from 'dotenv'
import { IplayarrParameter } from "../types/IplayarrParameters";

dotenv.config();

let isStorageInitialized : boolean = false;

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}


export interface ConfigMap {
    [key: string] : string
}

export const defaultConfigMap : ConfigMap = {
    "DEBUG" : "false",
    "ACTIVE_LIMIT" : "3",
    "REFRESH_SCHEDULE" : "0 * * * *",
    "AUTH_USERNAME" : "admin",
    "AUTH_PASSWORD" : "5f4dcc3b5aa765d61d8327deb882cf99",
    "FALLBACK_FILENAME_SUFFIX" : "WEB.H264-BBC",
    "MOVIE_FILENAME_TEMPLATE" : "{{title}}.BBC.WEB-DL.AAC.2.0.H.264",
    "TV_FILENAME_TEMPLATE" : "{{title}}.S{{season}}E{{episode}}.WEB.H264-BBC"
}

async function getConfigMap() : Promise<ConfigMap> {
    if (!isStorageInitialized) {
        await storage.init(storageOptions);
        isStorageInitialized = true;
    }
    return (await storage.getItem("config")) || {};
}

export const getParameter = async (parameter: IplayarrParameter): Promise<string | undefined> => {
    const configMap = await getConfigMap();
    return configMap[parameter.toString()] || process.env[parameter.toString()] || defaultConfigMap[parameter.toString()];
}

export const setParameter = async (parameter: IplayarrParameter, value : string) : Promise<void> => {
    const configMap = await getConfigMap();
    configMap[parameter] = value;
    await storage.setItem('config', configMap);
}

export const removeParameter = async (parameter: IplayarrParameter) : Promise<void> => {
    const configMap = await getConfigMap();
    delete configMap[parameter];
    await storage.setItem('config', configMap);
}

export const getAllConfig = async () : Promise<ConfigMap> =>  {
    let configMap : ConfigMap = {};
    for (const param of Object.values(IplayarrParameter)){
        const parameter : string | undefined = await getParameter(param);
        if (parameter){
            configMap[param] = parameter;
        }
    }
    return configMap;
}

// Function to reset storage initialization (for tests)
export const resetConfigService = () => {
    isStorageInitialized = false;
};
