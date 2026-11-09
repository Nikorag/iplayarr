import { defineEventHandler, readBody, setResponseStatus } from 'h3';

import sessionService from '../../service/auth/sessionService';
import configService from '../../service/configService';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { comparePassword, hashPassword, isLegacyMD5Hash, md5 } from '../../utils/Utils';

export default defineEventHandler(async (event) => {
    const [AUTH_USERNAME, AUTH_PASSWORD] = await Promise.all([
        configService.getParameter(IplayarrParameter.AUTH_USERNAME),
        configService.getParameter(IplayarrParameter.AUTH_PASSWORD),
    ]);
    const { username, password } = await readBody(event);

    if (username !== AUTH_USERNAME || !AUTH_PASSWORD) {
        setResponseStatus(event, 401);
        return { error: ApiError.INVALID_CREDENTIALS } as ApiResponse;
    }

    let passwordValid = false;

    if (isLegacyMD5Hash(AUTH_PASSWORD)) {
        // Stored password is a legacy MD5 hash — compare with MD5, then migrate to bcrypt
        passwordValid = md5(password) === AUTH_PASSWORD;
        if (passwordValid) {
            const bcryptHash = await hashPassword(password);
            await configService.setParameter(IplayarrParameter.AUTH_PASSWORD, bcryptHash);
        }
    } else {
        // Stored password is a bcrypt hash
        passwordValid = await comparePassword(password, AUTH_PASSWORD);
    }

    if (passwordValid) {
        const session = await sessionService.get(event);
        session.data.user = { username };
        await sessionService.save(event);
        return { status: true };
    }

    setResponseStatus(event, 401);
    return { error: ApiError.INVALID_CREDENTIALS } as ApiResponse;
});
