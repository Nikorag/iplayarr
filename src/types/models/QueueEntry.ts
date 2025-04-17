import { ChildProcess } from 'child_process';
import { DownloadDetails } from 'src/types/data/DownloadDetails';
import { VideoType } from 'src/types/data/IPlayerSearchResult';
import { Entity } from 'src/types/models/Entity';
import { QueueEntryStatus } from 'src/types/responses/sabnzbd/QueueResponse';

export interface QueueEntry extends Entity {
    pid : string,
    status : QueueEntryStatus,
    process? : ChildProcess,
    details?: DownloadDetails,
    nzbName: string,
    type : VideoType,
    appId? : string
}