import { v4 } from 'uuid';

import searchFacade from '../facade/searchFacade';
import { QueuedStorage } from '../types/QueuedStorage';
import { Synonym } from '../types/Synonym';

const storage: QueuedStorage = new QueuedStorage();

const synonymService = {
    getSynonym: async (inputTerm: string): Promise<Synonym | undefined> => {
        const allSynonyms = await synonymService.getAllSynonyms();
        return allSynonyms.find(
            ({ from: savedFrom, target: savedTarget }) =>
                savedFrom.toLocaleLowerCase() == inputTerm.toLocaleLowerCase() ||
                savedTarget.toLocaleLowerCase() == inputTerm.toLocaleLowerCase()
        );
    },

    getAllSynonyms: async (): Promise<Synonym[]> => {
        return (await storage.getItem('synonyms')) || [];
    },

    addSynonym: async (synonym: Synonym): Promise<void> => {
        if (!synonym.id) {
            const id = v4();
            synonym.id = id;
        }
        const allSynonyms = await synonymService.getAllSynonyms();
        allSynonyms.push(synonym);
        await storage.setItem('synonyms', allSynonyms);
        searchFacade.removeFromSearchCache(synonym.target);
    },

    updateSynonym: async (synonym: Synonym): Promise<void> => {
        await synonymService.removeSynonym(synonym.id);
        const allSynonyms = await synonymService.getAllSynonyms();
        allSynonyms.push(synonym);
        await storage.setItem('synonyms', allSynonyms);
        searchFacade.removeFromSearchCache(synonym.target);
    },

    removeSynonym: async (id: string): Promise<void> => {
        let allSynonyms = await synonymService.getAllSynonyms();
        const foundSynonym: Synonym | undefined = allSynonyms.find(({ id: savedId }) => savedId == id);
        if (foundSynonym) {
            allSynonyms = allSynonyms.filter(({ id: savedId }) => savedId != id);
            await storage.setItem('synonyms', allSynonyms);
            searchFacade.removeFromSearchCache(foundSynonym.target);
        }
    },
};

export default synonymService;
