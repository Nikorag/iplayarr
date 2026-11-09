import { defineEventHandler } from 'h3';

import configService from '../../service/configService';
import { IplayarrParameter } from '../../types/IplayarrParameters';

export default defineEventHandler(async () => {
    const authType = await configService.getParameter(IplayarrParameter.AUTH_TYPE);
    return { message: authType };
});
