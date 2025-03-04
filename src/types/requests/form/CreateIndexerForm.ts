export interface CreateIndexerForm {
    name : string,
    downloadClientId : number,
    url: string,
    urlBase? : string
    apiKey : string,
    categories : number[]
}