import { defineEventHandler } from 'h3';

import diagnosticsService from '../../service/diagnosticsService';

export default defineEventHandler(() => diagnosticsService.getReport());
