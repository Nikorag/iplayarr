import { defineEventHandler, getQuery } from 'h3';

import iplayerDetailsService from '../../service/iplayerDetailsService';

export default defineEventHandler(async (event) => {
    const { pid } = getQuery(event) as any;
    const details = await iplayerDetailsService.details([pid]);
    return details[0];
});
