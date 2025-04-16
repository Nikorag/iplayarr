export enum VideoType {
    TV = 'TV',
    MOVIE = 'MOVIE',
    UNKNOWN = 'UNKNOWN'
}

export interface IPlayerSearchResult {
    number : number,
    title : string,
    channel : string,
    pid : string, 
    request : IplayerSearchResultRequest,
    nzbName? : string,
    type : VideoType
    series? : number,
    episode? : number,
    episodeTitle? : string,
    size? : number,
    pubDate? : Date,
    allCategories? : string[]
}

export interface IplayerSearchResultRequest {
    term : string,
    line : string
}
