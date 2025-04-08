import { v4 } from 'uuid';

import { QueuedStorage } from '../types/QueuedStorage'
import { Synonym } from '../types/Synonym';
import iplayerService from './iplayerService';

const storage : QueuedStorage = new QueuedStorage();
let isStorageInitialized : boolean = false;

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}


const synonymService = {
    getSynonym : async (from : string) : Promise<Synonym | undefined> => {
        const allSynonyms = await synonymService.getAllSynonyms();
        return allSynonyms.find(({from : savedFrom}) => savedFrom.toLocaleLowerCase() == from.toLocaleLowerCase());
    },

    getAllSynonyms : async () : Promise<Synonym[]> => {
        if (!isStorageInitialized) {
            await storage.init(storageOptions);
            isStorageInitialized = true;
        }
        return (await storage.getItem('synonyms')) || [];
    },

    addSynonym : async (synonym : Synonym) : Promise<void> => {
        if (!synonym.id){
            const id = v4();
            synonym.id = id;
        }
        const allSynonyms = await synonymService.getAllSynonyms();
        allSynonyms.push(synonym);
        await storage.setItem('synonyms', allSynonyms);
        iplayerService.removeFromSearchCache(synonym.target);
    },

    updateSynonym : async (synonym : Synonym) : Promise<void> => {
        await synonymService.removeSynonym(synonym.id);
        const allSynonyms = await synonymService.getAllSynonyms();
        allSynonyms.push(synonym);
        await storage.setItem('synonyms', allSynonyms);
        iplayerService.removeFromSearchCache(synonym.target);
    },

    removeSynonym : async (id : string) : Promise<void> => {
        let allSynonyms = await synonymService.getAllSynonyms();
        const foundSynonym : Synonym | undefined = allSynonyms.find(({id : savedId}) => savedId == id);
        if (foundSynonym){
            allSynonyms = allSynonyms.filter(({id : savedId}) => savedId != id);
            await storage.setItem('synonyms', allSynonyms);
            iplayerService.removeFromSearchCache(foundSynonym.target);
        }
    }
}

export default synonymService;
