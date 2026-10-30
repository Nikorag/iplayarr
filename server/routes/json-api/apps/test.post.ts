import { defineEventHandler, readBody, setResponseStatus } from 'h3';

import appService from '../../../service/appService';
import { ApiError, ApiResponse } from '../../../types/responses/ApiResponse';

export default defineEventHandler(async (event) => {
    const result = await appService.testAppConnection(await readBody(event));
    if (result == true) {
        return { status: true };
    }
    setResponseStatus(event, 500);
    return { error: ApiError.INTERNAL_ERROR, message: result } as ApiResponse;
});
