export interface CreateIndexerForm {
    appId : string,
    name : string,
    downloadClientId : number,
    url: string,
    urlBase? : string
    apiKey : string,
    categories : number[],
    priority? : number
}