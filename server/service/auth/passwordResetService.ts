import { v4 } from 'uuid';

import { IplayarrParameter } from '../../types/IplayarrParameters';
import configService from '../configService';

const RESET_TOKEN_TTL_MS = 300000;

let token: string = '';
let resetTimer: NodeJS.Timeout | undefined;

const passwordResetService = {
    /** Prints a one-time code into the logs which can be used to reset the credentials to their defaults. */
    generateToken: () => {
        token = v4();
        console.log(`FORGOT PASSWORD TOKEN: ${token} This expires in 5 minutes`);
        if (resetTimer) {
            clearTimeout(resetTimer);
        }
        resetTimer = setTimeout(() => (token = ''), RESET_TOKEN_TTL_MS);
    },

    resetPassword: async (key: string) => {
        if (token != '' && key == token) {
            token = '';
            clearTimeout(resetTimer);
            await configService.setParameter(IplayarrParameter.AUTH_USERNAME, configService.defaultConfigMap.AUTH_USERNAME);
            await configService.setParameter(IplayarrParameter.AUTH_PASSWORD, configService.defaultConfigMap.AUTH_PASSWORD);
            await configService.setParameter(IplayarrParameter.AUTH_TYPE, configService.defaultConfigMap.AUTH_TYPE);
        }
    },
};

export default passwordResetService;
