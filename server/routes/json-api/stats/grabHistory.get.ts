import { defineEventHandler, getQuery } from 'h3';

import statisticsService from '../../../service/stats/StatisticsService';

export default defineEventHandler(async (event) => {
    const { limit } = getQuery(event) as any as { limit?: number };
    const grabHistory = await statisticsService.getGrabHistory();
    return limit ? grabHistory.slice(limit * -1) : grabHistory;
});
