import { defineEventHandler, getQuery, setResponseStatus } from 'h3';

import searchFacade from '../../facade/searchFacade';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';

export default defineEventHandler(async (event) => {
    const { q } = getQuery(event) as any;
    try {
        return await searchFacade.search(q);
    } catch (error: any) {
        setResponseStatus(event, 500);
        return { error: ApiError.INTERNAL_ERROR, message: error?.message || 'Search failed' } as ApiResponse;
    }
});
