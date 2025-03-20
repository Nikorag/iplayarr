import { AppType } from '../enums/AppType';
import { AbstractStoredType } from './AbstractStoredType';

export interface App extends AbstractStoredType {
    type : AppType,
    name : string,
    url : string,
    api_key? : string,
    username? : string,
    password? : string,
    priority? : number,
    iplayarr : {
        host : string,
        port : number,
        useSSL : boolean
    }
    download_client? : {
        id: number,
        name?: string,
        host?: string,
        api_key?: string,
        port?: number
    },
    indexer? : {
        id : number,
        name?: string,
        url?: string,
        api_key?: string,
        priority : number
    }
}