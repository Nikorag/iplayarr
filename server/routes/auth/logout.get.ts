import { defineEventHandler } from 'h3';

import sessionService from '../../service/auth/sessionService';

export default defineEventHandler(async (event) => {
    await sessionService.destroy(event);
    return { status: true };
});
