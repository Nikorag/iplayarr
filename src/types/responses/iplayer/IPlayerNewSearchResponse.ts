export interface IPlayerNewSearchResponse {
    new_search : {
        results : IPlayerNewSearchResult[]
    }
}

export interface IPlayerNewSearchResult {
    id : string
    title : string,
    categories : string[],
    count? : number,
    master_brand? : {
        titles? : {
            large? : string
        }
    }
}