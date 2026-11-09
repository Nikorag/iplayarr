import { defineEventHandler } from 'h3';

import { version } from '../../../config/version.json';

export default defineEventHandler(() => ({
    HIDE_DONATE: Boolean(process.env.HIDE_DONATE) || false,
    VERSION: version,
}));
