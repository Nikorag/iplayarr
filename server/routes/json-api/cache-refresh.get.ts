import { defineEventHandler } from 'h3';

import scheduleFacade from '../../facade/scheduleFacade';

export default defineEventHandler(() => {
    scheduleFacade.refreshCache();
    return { status: true };
});
