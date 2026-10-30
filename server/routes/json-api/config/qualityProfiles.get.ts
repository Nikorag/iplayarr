import { defineEventHandler } from 'h3';

import { qualityProfiles } from '../../../types/QualityProfiles';

export default defineEventHandler(() => qualityProfiles);
