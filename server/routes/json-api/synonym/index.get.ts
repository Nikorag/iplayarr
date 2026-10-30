import { defineEventHandler } from 'h3';

import synonymService from '../../../service/synonymService';

export default defineEventHandler(() => synonymService.getAllSynonyms());
