import { defineEventHandler } from 'h3';

import statisticsService from '../../../service/stats/StatisticsService';

export default defineEventHandler(() => statisticsService.getCacheSizes());
