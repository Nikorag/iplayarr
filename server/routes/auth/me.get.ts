import { defineEventHandler, setResponseStatus } from 'h3';

import sessionService from '../../service/auth/sessionService';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';

export default defineEventHandler(async (event) => {
    const user = await sessionService.getUser(event);
    if (!user) {
        setResponseStatus(event, 401);
        return { error: ApiError.NOT_AUTHORISED } as ApiResponse;
    }
    return user;
});
