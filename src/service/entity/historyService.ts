import { QueueEntry } from '../../types/models/QueueEntry';
import { QueueEntryStatus } from '../../types/responses/sabnzbd/QueueResponse';
import AbstractStorageService from './AbstractStorageService';

class historyService extends AbstractStorageService<QueueEntry> {
    async addHistory(item : QueueEntry) : Promise<void> {
        const historyItem : QueueEntry = {...item, status: QueueEntryStatus.COMPLETE, details : {...item.details, eta: '', speed: 0, progress: 100}, process : undefined};
        await super.setItem(item.pid, historyItem);
    }

    async addRelay(item : QueueEntry) : Promise<void> {
        await super.setItem(item.pid, item);
    }

    async addArchive(item : QueueEntry) : Promise<void> {
        const historyItem : QueueEntry = {...item, status: QueueEntryStatus.CANCELLED, details : {...item.details, eta: '', speed: 0, progress: 100}, process : undefined};
        await super.setItem(item.pid, historyItem);
    }
}

export default new historyService('history');
