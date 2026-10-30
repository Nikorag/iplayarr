import { AbstractHistoryEntry } from './AbstractHistoryEntry';

export interface SearchHistoryEntry extends AbstractHistoryEntry {
    term: string;
    results: number;
    series?: number;
    episode?: number;
}
