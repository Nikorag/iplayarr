import { defineEventHandler } from 'h3';

import configService from '../../../service/configService';

export default defineEventHandler(() => configService.getAllConfig());
