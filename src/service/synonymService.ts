import storage from 'node-persist';
import { v4 } from 'uuid';

import { Synonym } from '../types/Synonym';

let isStorageInitialized : boolean = false;

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}


const synonymService = {
    getSynonym : async (from : string) : Promise<Synonym | undefined> => {
        const allSynonyms = await synonymService.getAllSynonyms();
        return allSynonyms.find(({from : savedFrom}) => savedFrom == from);
    },

    getAllSynonyms : async () : Promise<Synonym[]> => {
        if (!isStorageInitialized) {
            await storage.init(storageOptions);
            isStorageInitialized = true;
        }
        return (await storage.getItem('synonyms')) || [];
    },

    addSynonym : async (synonym : Synonym) : Promise<void> => {
        const id = v4();
        synonym.id = id;
        const allSynonyms = await synonymService.getAllSynonyms();
        allSynonyms.push(synonym);
        await storage.setItem('synonyms', allSynonyms);
    },

    removeSynonym : async (id : string) : Promise<void> => {
        let allSynonyms = await synonymService.getAllSynonyms();
        allSynonyms = allSynonyms.filter(({id : savedId}) => savedId != id);
        await storage.setItem('synonyms', allSynonyms);
    }
}

export default synonymService;
