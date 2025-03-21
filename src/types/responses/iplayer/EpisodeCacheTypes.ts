import { AbstractStoredType } from '../../models/AbstractStoredType'

export interface IPlayerDataLayerResponse {
    header : {
        title : string,
        subtitle : string,
        availableSlices : {
            id : string,
            title : string
        }[],
        genre: string
    },
    episode? : {
        title : string,
        subtitle : string
    },
    entities : {
        results : {
            episode : {
                id : string
                subtitle : {
                    slice : string
                },
                synopsis : {
                    small : string
                }
            }
        }[]
    }
}

export interface EpisodeCacheDefinition extends AbstractStoredType {
    url : string,
    name : string,
    cacheRefreshed? : Date
}