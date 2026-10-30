import { defineEventHandler, getQuery, getRouterParam, setResponseStatus } from 'h3';

import arrFacade from '../../../../facade/arrFacade';
import appService from '../../../../service/appService';
import { App } from '../../../../types/App';
import { ApiError, ApiResponse } from '../../../../types/responses/ApiResponse';
import { ArrLookupResponse } from '../../../../types/responses/arr/ArrLookupResponse';

export default defineEventHandler(async (event) => {
    const appId = getRouterParam(event, 'appId') as string;
    const { term } = getQuery(event) as { term?: string };

    const app: App | undefined = await appService.getApp(appId);
    if (app) {
        try {
            const results: ArrLookupResponse[] = await arrFacade.search(app, term);
            return results;
        } catch (err: any) {
            setResponseStatus(event, 400);
            return { error: ApiError.INTERNAL_ERROR, message: err?.message } as ApiResponse;
        }
    }
    setResponseStatus(event, 400);
    return { error: ApiError.INTERNAL_ERROR, message: `App ${appId} not found` } as ApiResponse;
});
