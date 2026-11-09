import { defineEventHandler, readBody } from 'h3';

import appService from '../../../service/appService';

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event);
    await appService.removeApp(id);
    return true;
});
