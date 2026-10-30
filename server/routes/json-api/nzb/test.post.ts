import { defineEventHandler, readBody, setResponseStatus } from 'h3';

import nzbFacade from '../../../facade/nzbFacade';
import { ApiError, ApiResponse } from '../../../types/responses/ApiResponse';

export default defineEventHandler(async (event) => {
    const { NZB_URL, NZB_API_KEY, NZB_TYPE, NZB_USERNAME, NZB_PASSWORD } = await readBody(event);
    const result: string | boolean = await nzbFacade.testConnection(
        NZB_TYPE,
        NZB_URL,
        NZB_API_KEY,
        NZB_USERNAME,
        NZB_PASSWORD
    );
    if (result == true) {
        return { status: true };
    }
    setResponseStatus(event, 500);
    return { error: ApiError.INTERNAL_ERROR, message: result } as ApiResponse;
});
