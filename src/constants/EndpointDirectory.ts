import { RequestHandler } from 'express'
import DownloadEndpoint from 'src/endpoints/generic/DownloadEndpoint'
import CapsEndpoint from 'src/endpoints/newznab/CapsEndpoint'
import SearchEndpoint from 'src/endpoints/newznab/SearchEndpoint'
import AddFileEndpoint from 'src/endpoints/sabnzbd/AddFileEndpoint'
import ConfigEndpoint from 'src/endpoints/sabnzbd/ConfigEndpoint'
import DownloadNZBEndpoint from 'src/endpoints/sabnzbd/DownloadNZBEndpoint'
import HistoryEndpoint from 'src/endpoints/sabnzbd/HistoryEndpoint'
import QueueEndpoint from 'src/endpoints/sabnzbd/QueueEndpoint'
import VersionEndpoint from 'src/endpoints/sabnzbd/VersionEndpoint'

export interface EndpointDirectory {
    [key : string] : RequestHandler
}

export const GenericEndpointDirectory : EndpointDirectory = {
    download : DownloadEndpoint
}

export const SabNZBDEndpointDirectory : EndpointDirectory = {
    ...GenericEndpointDirectory,
    queue : QueueEndpoint,
    get_config : ConfigEndpoint,
    history : HistoryEndpoint,
    version : VersionEndpoint,
    'nzb-download' : DownloadNZBEndpoint,
    addfile : AddFileEndpoint
}

export const NewzNabEndpointDirectory : EndpointDirectory = {
    ...GenericEndpointDirectory,
    caps : CapsEndpoint,
    tvsearch : SearchEndpoint,
    movie : SearchEndpoint,
    search : SearchEndpoint
}

