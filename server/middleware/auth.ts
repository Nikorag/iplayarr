import { defineEventHandler, setResponseStatus } from 'h3';

import sessionService from '../service/auth/sessionService';
import { ApiError, ApiResponse } from '../types/responses/ApiResponse';

// Everything under /json-api requires a logged in user (or AUTH_TYPE=none)
export default defineEventHandler(async (event) => {
    if (!event.path.startsWith('/json-api/')) {
        return;
    }
    if (!(await sessionService.getUser(event))) {
        setResponseStatus(event, 401);
        return { error: ApiError.NOT_AUTHORISED } as ApiResponse;
    }
});
