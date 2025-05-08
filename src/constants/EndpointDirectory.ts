import { RequestHandler } from 'express';

import DownloadEndpoint from '../endpoints/generic/DownloadEndpoint';
import CapsEndpoint from '../endpoints/newznab/CapsEndpoint';
import SearchEndpoint from '../endpoints/newznab/SearchEndpoint';
import AddFileEndpoint from '../endpoints/sabnzbd/AddFileEndpoint';
import ConfigEndpoint from '../endpoints/sabnzbd/ConfigEndpoint';
import DownloadNZBEndpoint from '../endpoints/sabnzbd/DownloadNZBEndpoint';
import HistoryEndpoint from '../endpoints/sabnzbd/HistoryEndpoint';
import QueueEndpoint from '../endpoints/sabnzbd/QueueEndpoint';
import VersionEndpoint from '../endpoints/sabnzbd/VersionEndpoint';

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
