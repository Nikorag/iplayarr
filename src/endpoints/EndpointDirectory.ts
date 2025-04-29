import { RequestHandler } from 'express';

import DownloadEndpoint from './generic/DownloadEndpoint';
import CapsEndpoint from './newznab/CapsEndpoint';
import SearchEndpoint from './newznab/SearchEndpoint';
import AddFileEndpoint from './sabnzbd/AddFileEndpoint';
import ConfigEndpoint from './sabnzbd/ConfigEndpoint';
import DownloadNZBEndpoint from './sabnzbd/DownloadNZBEndpoint';
import HistoryEndpoint from './sabnzbd/HistoryEndpoint';
import QueueEndpoint from './sabnzbd/QueueEndpoint';
import VersionEndpoint from './sabnzbd/VersionEndpoint';

export interface EndpointDirectory {
    [key: string]: RequestHandler;
}

export const GenericEndpointDirectory: EndpointDirectory = {
    download: DownloadEndpoint,
};

export const SabNZBDEndpointDirectory: EndpointDirectory = {
    ...GenericEndpointDirectory,
    queue: QueueEndpoint,
    get_config: ConfigEndpoint,
    history: HistoryEndpoint,
    version: VersionEndpoint,
    'nzb-download': DownloadNZBEndpoint,
    addfile: AddFileEndpoint,
};

export const NewzNabEndpointDirectory: EndpointDirectory = {
    ...GenericEndpointDirectory,
    caps: CapsEndpoint,
    tvsearch: SearchEndpoint,
    movie: SearchEndpoint,
    search: SearchEndpoint,
};
