import { defineEventHandler } from 'h3';

import episodeCacheService from '../../../service/episodeCacheService';

export default defineEventHandler(() => episodeCacheService.getCachedSeries());
