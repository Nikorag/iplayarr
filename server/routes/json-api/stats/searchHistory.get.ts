import { defineEventHandler, getQuery } from 'h3';

import statisticsService from '../../../service/stats/StatisticsService';

export default defineEventHandler(async (event) => {
    const { limit, filterRss } = getQuery(event) as any as { limit?: number; filterRss?: boolean };
    let searchHistory = await statisticsService.getSearchHistory();
    searchHistory = filterRss ? searchHistory.filter(({ term }) => term != '*') : searchHistory;
    return limit ? searchHistory.slice(limit * -1) : searchHistory;
});
