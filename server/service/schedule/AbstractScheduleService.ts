import { IPlayerSearchResult } from '../../types/IPlayerSearchResult';

export interface AbstractScheduleService {
    refreshCache () : Promise<void>;
    getFeed () : Promise<IPlayerSearchResult[]>;
}