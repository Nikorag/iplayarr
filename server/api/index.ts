import { defineEventHandler, getQuery, setResponseStatus } from 'h3';

import { EndpointDirectory, NewzNabEndpointDirectory, SabNZBDEndpointDirectory } from '../constants/EndpointDirectory';
import configService from '../service/configService';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { ApiError, ApiResponse } from '../types/responses/ApiResponse';

interface ApiRequest {
    apikey: string;
    mode?: string;
    t?: string;
}

export default defineEventHandler(async (event) => {
    const { apikey: queryKey, mode, t } = getQuery(event) as any as ApiRequest;
    const envKey: string | undefined = await configService.getParameter(IplayarrParameter.API_KEY);
    if (envKey && envKey == queryKey) {
        const endpoint: string | undefined = mode || t;
        const directory: EndpointDirectory = mode ? SabNZBDEndpointDirectory : NewzNabEndpointDirectory;
        if (endpoint && directory[endpoint]) {
            return directory[endpoint](event);
        }
        setResponseStatus(event, 404);
        return { error: ApiError.API_NOT_FOUND } as ApiResponse;
    }
    setResponseStatus(event, 401);
    return { error: ApiError.NOT_AUTHORISED } as ApiResponse;
});
