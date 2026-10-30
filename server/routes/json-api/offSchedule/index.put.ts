import { defineEventHandler, readBody, setResponseStatus } from 'h3';

import episodeCacheService from '../../../service/episodeCacheService';
import { ApiError, ApiResponse } from '../../../types/responses/ApiResponse';
import { OffScheduleFormValidator } from '../../../validators/OffScheduleFormValidator';
import { Validator } from '../../../validators/Validator';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const validator: Validator = new OffScheduleFormValidator();
    const validationResult: { [key: string]: string } = await validator.validate(body);
    if (Object.keys(validationResult).length > 0) {
        setResponseStatus(event, 400);
        return { error: ApiError.INVALID_INPUT, invalid_fields: validationResult } as ApiResponse;
    }

    const { name, url, id } = body;
    await episodeCacheService.updateCachedSeries({ id, url, name, cacheRefreshed: undefined });
    return episodeCacheService.getCachedSeries();
});
