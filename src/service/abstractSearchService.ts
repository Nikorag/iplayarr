import { SearchFacets, SearchResponse } from 'src/types/responses/SearchResponse';
import { Synonym } from 'src/types/Synonym';

export interface AbstractSearchService {
    performSearch : (term: string, synonym: Synonym | undefined, page: number, facets : SearchFacets) => Promise<SearchResponse>
}