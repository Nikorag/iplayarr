import { RequestHandler } from "express"
import QueueEndpoint from "./sabnzbd/QueueEndpoint"
import ConfigEndpoint from "./sabnzbd/ConfigEndpoint"
import HistoryEndpoint from "./sabnzbd/HistoryEndpoint"
import CapsEndpoint from "./newznab/CapsEndpoint"
import TvSearchEndpoint from "./newznab/TvSearchEndpoint"
import AddFileEndpoint from "./sabnzbd/AddFileEndpoint"
import DownloadNZBEndpoint from "./sabnzbd/DownloadNZBEndpoint"
import VersionEndpoint from "./sabnzbd/VersionEndpoint"
import MovieEndpoint from "./newznab/MovieEndpoint"

export interface EndpointDirectory {
    [key : string] : RequestHandler
}

export const SabNZBDEndpointDirectory : EndpointDirectory = {
    queue : QueueEndpoint,
    get_config : ConfigEndpoint,
    history : HistoryEndpoint,
    version : VersionEndpoint,
    "nzb-download" : DownloadNZBEndpoint,
    addfile : AddFileEndpoint
}

export const NewzNabEndpointDirectory : EndpointDirectory = {
    caps : CapsEndpoint,
    tvsearch : TvSearchEndpoint,
    movie : MovieEndpoint,
    search : MovieEndpoint
}