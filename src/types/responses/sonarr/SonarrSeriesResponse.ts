export interface SonarrSeriesResponse {
    id : string,
    seasons : SonarrSeason[],
    title : string
}

export interface SonarrSeason {
    seasonNumber : number,
    monitored : boolean
}

export interface SonarrEpisodeResponse {
    episodeNumber : number,
    title : string
}