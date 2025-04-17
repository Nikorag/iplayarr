import { ChildProcess } from 'child_process';

import { DownloadDetails } from '../data/DownloadDetails';
import { VideoType } from '../data/IPlayerSearchResult';
import { QueueEntryStatus } from '../responses/sabnzbd/QueueResponse';
import { Entity } from './Entity';

export interface QueueEntry extends Entity {
    pid : string,
    status : QueueEntryStatus,
    process? : ChildProcess,
    details?: DownloadDetails,
    nzbName: string,
    type : VideoType,
    appId? : string
}