import { VideoType } from '../IPlayerSearchResult';
import { AbstractHistoryEntry } from './AbstractHistoryEntry';

export interface GrabHistoryEntry extends AbstractHistoryEntry {
    pid: string
    nzbName: string
    type: VideoType
}