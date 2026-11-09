import { defineEventHandler } from 'h3';

import statisticsService from '../../../service/stats/StatisticsService';

export default defineEventHandler(async () => ({ uptime: await statisticsService.getUptime() }));
