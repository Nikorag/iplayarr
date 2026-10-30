import { defineEventHandler } from 'h3';

import passwordResetService from '../../service/auth/passwordResetService';

export default defineEventHandler(() => {
    passwordResetService.generateToken();
    return { status: true };
});
