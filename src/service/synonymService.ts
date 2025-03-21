import { Synonym } from '../types/models/Synonym';
import AbstractStorageService from './abstractStorageService';
import iplayerService from './iplayerService';

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}

class SynonymService extends AbstractStorageService<Synonym> {
    async setItem(id : string, synonym: Synonym): Promise<Synonym> {
        const updated = await super.setItem(id, synonym);
        iplayerService.removeFromSearchCache(synonym.target);
        return updated;
    }

    async removeItem(id: string): Promise<void> {
        const synonym = await this.getItem(id);
        if (synonym){
            await super.removeItem(id);
            iplayerService.removeFromSearchCache(synonym.target);
        }
    }
}

export default new SynonymService('synonyms');
