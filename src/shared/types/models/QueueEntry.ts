import { ChildProcess } from 'child_process';

import { DownloadDetails } from '../data/DownloadDetails';
import { VideoType } from '../responses/iplayer/IPlayerSearchResult';
import { QueueEntryStatus } from '../responses/sabnzbd/QueueResponse';
import { AbstractStoredType } from './AbstractStoredType';

export interface QueueEntry extends AbstractStoredType{
    pid : string,
    status : QueueEntryStatus,
    process? : ChildProcess,
    details?: DownloadDetails,
    nzbName: string,
    type : VideoType,
    appId? : string
}