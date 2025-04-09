import { Synonym } from '../types/models/Synonym';
import AbstractStorageService from './AbstractStorageService';

class SynonymService extends AbstractStorageService<Synonym> {
    async getSynonym(inputTerm : string) : Promise<Synonym | undefined> {
        const allSynonyms : Synonym[] = await this.all();
        return allSynonyms.find(({from : savedFrom, target : savedTarget }) => 
            savedFrom.toLocaleLowerCase() == inputTerm.toLocaleLowerCase() ||
            savedTarget.toLocaleLowerCase() == inputTerm.toLocaleLowerCase());
    }
}

export default new SynonymService('synonyms');