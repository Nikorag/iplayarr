import { defineEventHandler, readBody } from 'h3';

import episodeCacheService from '../../../service/episodeCacheService';

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event);
    await episodeCacheService.removeCachedSeries(id);
    return episodeCacheService.getCachedSeries();
});
