import { Synonym } from '../shared/types/models/Synonym';
import AbstractStorageService from './abstractStorageService';
import iplayerService from './iplayerService';

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}

class SynonymService extends AbstractStorageService<Synonym> {
    async setItem(synonym: Synonym): Promise<Synonym> {
        const updated = await super.setItem(synonym);
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
