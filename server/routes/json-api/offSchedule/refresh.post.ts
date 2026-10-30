import { defineEventHandler, readBody } from 'h3';

import episodeCacheService from '../../../service/episodeCacheService';
import { EpisodeCacheDefinition } from '../../../types/responses/EpisodeCacheTypes';

export default defineEventHandler(async (event) => {
    const def: EpisodeCacheDefinition = await readBody(event);
    episodeCacheService.recacheSeries(def);
    return { status: true };
});
