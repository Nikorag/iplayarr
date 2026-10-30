import { defineEventHandler, readBody } from 'h3';

import synonymService from '../../../service/synonymService';

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event);
    await synonymService.removeSynonym(id);
    return synonymService.getAllSynonyms();
});
