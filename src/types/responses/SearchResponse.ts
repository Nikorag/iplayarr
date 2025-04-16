import { IPlayerSearchResult } from '../IPlayerSearchResult'

export interface SearchResponse {
    pagination : {
        page : number,
        totalPages : number,
        totalResults : number
    },
    results : IPlayerSearchResult[]
}