import { defineEventHandler } from 'h3';

import { appFeatures } from '../../../types/AppType';

export default defineEventHandler(() => appFeatures);
