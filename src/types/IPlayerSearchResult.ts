export interface IPlayerSearchResult {
    number : number,
    title : string,
    channel : string,
    pid : string, 
    request : IplayerSearchResultRequest,
    nzbName? : string
}

export interface IplayerSearchResultRequest {
    term : string,
    line : string
}