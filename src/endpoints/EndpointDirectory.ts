import { RequestHandler } from 'express'

import CapsEndpoint from './newznab/CapsEndpoint'
import SearchEndpoint from './newznab/SearchEndpoint'
import AddFileEndpoint from './sabnzbd/AddFileEndpoint'
import ConfigEndpoint from './sabnzbd/ConfigEndpoint'
import DownloadNZBEndpoint from './sabnzbd/DownloadNZBEndpoint'
import HistoryEndpoint from './sabnzbd/HistoryEndpoint'
import QueueEndpoint from './sabnzbd/QueueEndpoint'
import VersionEndpoint from './sabnzbd/VersionEndpoint'

export interface EndpointDirectory {
    [key : string] : RequestHandler
}

export const SabNZBDEndpointDirectory : EndpointDirectory = {
    queue : QueueEndpoint,
    get_config : ConfigEndpoint,
    history : HistoryEndpoint,
    version : VersionEndpoint,
    'nzb-download' : DownloadNZBEndpoint,
    addfile : AddFileEndpoint
}

export const NewzNabEndpointDirectory : EndpointDirectory = {
    caps : CapsEndpoint,
    tvsearch : SearchEndpoint,
    movie : SearchEndpoint,
    search : SearchEndpoint
}