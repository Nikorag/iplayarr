import { IPlayerSearchResult } from '../IPlayerSearchResult'

export interface SearchResponse {
    pagination : {
        page : number,
        totalPages : number,
        totalResults : number
    },
    results : IPlayerSearchResult[],
    facets : Facet[]
}

export interface Facet {
    title: string,
    values : FacetValue[]
}

export interface FacetValue {
    label : string,
    total : number
}