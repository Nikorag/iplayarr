import { IPlayerSearchResult } from '../../types/IPlayerSearchResult';
import { Synonym } from '../../types/Synonym';

export default interface AbstractSearchService {
    search(term : string, synonym?: Synonym): Promise<IPlayerSearchResult[]>;
    processCompletedSearch(results: IPlayerSearchResult[], inputTerm: string, season?: number, episode?: number): Promise<IPlayerSearchResult[]>;
}