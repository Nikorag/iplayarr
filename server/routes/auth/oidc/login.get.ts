import { defineEventHandler, setResponseStatus } from 'h3';

import OIDCService from '../../../service/auth/OIDCService';
import configService from '../../../service/configService';
import { IplayarrParameter } from '../../../types/IplayarrParameters';
import { ApiError, ApiResponse } from '../../../types/responses/ApiResponse';

export default defineEventHandler(async (event) => {
    const authType = await configService.getParameter(IplayarrParameter.AUTH_TYPE);
    if (authType != 'oidc') {
        setResponseStatus(event, 400);
        return { error: ApiError.OIDC_NOT_ENABLED } as ApiResponse;
    }

    const url = await OIDCService.getAuthURL(event);

    return { url };
});
