import { Entity } from './Entity';

export interface EpisodeCacheDefinition extends Entity {
    url : string,
    name : string,
    cacheRefreshed? : Date
}