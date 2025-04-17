import { AppType } from 'src/types/enums/AppType'
import { Entity } from 'src/types/models/Entity'

export interface App extends Entity {
    type : AppType,
    name : string,
    url : string,
    link? : string,
    api_key? : string,
    username? : string,
    password? : string,
    priority? : number,
    tags?: string[],
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