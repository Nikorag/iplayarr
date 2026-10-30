import { timingSafeEqual } from 'crypto';
import { createError, getRouterParam, H3Event } from 'h3';

import { IplayarrParameter } from '../types/IplayarrParameters';
import { ApiError } from '../types/responses/ApiResponse';
import configService from './configService';
import liveTvService from './liveTvService';

const matches = (a: string, b: string): boolean => {
    const [bufferA, bufferB] = [Buffer.from(a), Buffer.from(b)];
    return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
};

/**
 * Live TV URLs carry the API key as a path segment (/tv/<key>/...), rather than a query parameter, as the
 * relative URLs inside proxied HLS playlists would otherwise lose it. 404s if Live TV isn't switched on.
 */
export async function assertLiveTvAccess(event: H3Event): Promise<void> {
    if (!(await liveTvService.isEnabled())) {
        throw createError({ statusCode: 404, statusMessage: 'Live TV is not enabled' });
    }
    const [key, apiKey] = [
        getRouterParam(event, 'key') ?? '',
        await configService.getParameter(IplayarrParameter.API_KEY),
    ];
    if (!apiKey || !matches(key, apiKey)) {
        throw createError({ statusCode: 401, statusMessage: ApiError.NOT_AUTHORISED });
    }
}
