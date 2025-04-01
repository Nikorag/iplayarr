import { Synonym } from '../types/models/Synonym';
import AbstractStorageService from './AbstractStorageService';

class SynonymService extends AbstractStorageService<Synonym> {
    async getSynonym(from : string) : Promise<Synonym | undefined> {
        const allSynonyms : Synonym[] = await this.all();
        return allSynonyms.find(({from : savedFrom}) => savedFrom == from);
    }
}

export default new SynonymService('synonyms');