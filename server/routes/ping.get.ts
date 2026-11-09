import { defineEventHandler, setResponseStatus } from 'h3';

import { getDatabase } from '../db/database';

// Healthcheck endpoint (unauthenticated)
export default defineEventHandler(async (event) => {
    try {
        await (await getDatabase()).ping();
        return { status: 'OK' };
    } catch (error: any) {
        setResponseStatus(event, 503);
        return { status: 'ERROR', message: `Database error - ${error?.message}` };
    }
});
