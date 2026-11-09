import { defineEventHandler } from 'h3';

import scheduleFacade from '../../facade/scheduleFacade';
import loggingService from '../../service/loggingService';

export default defineEventHandler(() => {
    // The refresh runs in the background, so report its failure here rather than leaving an unhandled rejection
    scheduleFacade.refreshCache().catch((error) => {
        loggingService.error(`Manual schedule refresh failed: ${error?.message ?? error}`);
    });
    return { status: true };
});
