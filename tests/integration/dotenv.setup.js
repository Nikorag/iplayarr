/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Loaded via jest setupFiles — runs before any test module.
 * Populates process.env from .env.integration if the file exists.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.integration') });
