import { defineEventHandler, readBody, setResponseStatus } from 'h3';

import configService from '../../../service/configService';
import { IplayarrParameter } from '../../../types/IplayarrParameters';
import { ApiError, ApiResponse } from '../../../types/responses/ApiResponse';
import { comparePassword, hashPassword, isLegacyMD5Hash, md5 } from '../../../utils/Utils';
import { ConfigFormValidator } from '../../../validators/ConfigFormValidator';
import { Validator } from '../../../validators/Validator';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const validator: Validator = new ConfigFormValidator();
    const validationResult: { [key: string]: string } = await validator.validate(body);
    if (Object.keys(validationResult).length > 0) {
        setResponseStatus(event, 400);
        return {
            error: ApiError.INVALID_INPUT,
            invalid_fields: validationResult,
        } as ApiResponse;
    }
    for (const key of Object.keys(body)) {
        const val = body[key];
        if (key == IplayarrParameter.AUTH_PASSWORD) {
            const existing = await configService.getParameter(IplayarrParameter.AUTH_PASSWORD);
            // Check if the submitted value is already the stored hash (no change)
            if (existing === val) {
                continue;
            }
            // Check if the plaintext matches the existing hash (no change)
            let alreadyMatches = false;
            if (existing) {
                if (isLegacyMD5Hash(existing)) {
                    alreadyMatches = md5(val) === existing;
                } else {
                    alreadyMatches = await comparePassword(val, existing);
                }
            }
            if (!alreadyMatches) {
                const hashed = await hashPassword(val);
                await configService.setParameter(key as IplayarrParameter, hashed);
            }
        } else {
            await configService.setParameter(key as IplayarrParameter, val);
        }
    }
    return body;
});
