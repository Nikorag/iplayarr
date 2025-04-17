import { Synonym } from '../../types/models/Synonym';
import searchService from '../searchService';
import AbstractStorageService from './AbstractStorageService';


class SynonymService extends AbstractStorageService<Synonym> {
    async getSynonym(inputTerm : string) : Promise<Synonym | undefined> {
        const allSynonyms = await this.all();
        return allSynonyms.find(({from : savedFrom, target : savedTarget }) => 
            savedFrom.toLocaleLowerCase() == inputTerm.toLocaleLowerCase() ||
            savedTarget.toLocaleLowerCase() == inputTerm.toLocaleLowerCase());
    }

    async setItem(id : string, value: Synonym): Promise<Synonym> {
        searchService.removeFromSearchCache(value.target);
        return super.setItem(id, value);
    }

    async updateItem(id : string, value: Partial<Synonym>): Promise<Synonym | undefined>{
        if (value.target){
            searchService.removeFromSearchCache(value.target);
        }
        return super.updateItem(id, value);
    }

    async removeItem(id: string): Promise<void>{
        const synonym = await this.getItem(id);
        if (synonym){
            searchService.removeFromSearchCache(synonym.target);
        }
        await super.removeItem(id);
    }
}

export default new SynonymService('synonyms');
