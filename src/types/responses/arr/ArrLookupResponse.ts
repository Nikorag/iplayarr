export interface ArrLookupResponse {
    id : number,
    title : string,
    sortTitle : string,
    path? : string,
    alternateTitles?: {
        title: string,
        seasonNumber: number
    }[]
}