import { defineEventHandler, readBody } from 'h3';

import passwordResetService from '../../service/auth/passwordResetService';

export default defineEventHandler(async (event) => {
    const { key } = await readBody(event);
    await passwordResetService.resetPassword(key);
    return { status: true };
});
