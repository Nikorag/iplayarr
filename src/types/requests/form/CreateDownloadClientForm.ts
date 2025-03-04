export interface CreateDownloadClientForm {
    name : string
    host : string,
    port : number,
    useSSL : boolean,
    urlBase? : string
    apiKey : string,
}