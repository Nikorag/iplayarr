import { ChildProcess } from 'child_process';

import { DownloadDetails } from './DownloadDetails';
import { VideoType } from './IPlayerSearchResult';
import { QueueEntryStatus } from './responses/sabnzbd/QueueResponse';

export interface QueueEntry {
    pid: string;
    status: QueueEntryStatus;
    process?: ChildProcess;
    details?: DownloadDetails;
    nzbName: string;
    type: VideoType;
    appId?: string;
    category?: string;
}

export interface HistoryEntry extends QueueEntry {
    completedAt?: string;
    archivedAt?: string;
}
