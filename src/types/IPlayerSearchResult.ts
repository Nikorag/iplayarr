export enum VideoType {
    TV = "TV",
    MOVIE = "MOVIE"
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
    episode? : number
}

export interface IplayerSearchResultRequest {
    term : string,
    line : string
}