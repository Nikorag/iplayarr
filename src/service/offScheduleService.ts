import { EpisodeCacheDefinition } from '../types/responses/iplayer/EpisodeCacheTypes';
import AbstractStorageService from './abstractStorageService';

class OffScheduleService extends AbstractStorageService<EpisodeCacheDefinition> {

}

export default new OffScheduleService('series-cache-definition');