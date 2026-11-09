import { defineEventHandler, readBody } from 'h3';

import synonymService from '../../../service/synonymService';
import { Synonym } from '../../../types/Synonym';

export default defineEventHandler(async (event) => {
    const synonym: Synonym = await readBody(event);
    await synonymService.updateSynonym(synonym);
    return synonymService.getAllSynonyms();
});
