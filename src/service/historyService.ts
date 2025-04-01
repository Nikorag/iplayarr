import { QueueEntry } from '../types/models/QueueEntry';
import { QueueEntryStatus } from '../types/responses/sabnzbd/QueueResponse';
import AbstractStorageService from './AbstractStorageService';
import socketService from './socketService';

class HistoryService extends AbstractStorageService<QueueEntry> {
    async addHistory(value: QueueEntry): Promise<QueueEntry> {
        const historyItem : QueueEntry = {...value, id : value.pid, status: QueueEntryStatus.COMPLETE, details : {...value.details, eta: '', speed: 0, progress: 100}, process : undefined};
        await super.setItem(historyItem.id, historyItem);
        const history : QueueEntry[] = await this.all();
        socketService.emit('history', history);
        return historyItem;
    }

    async setItem(id: string | undefined, value: QueueEntry): Promise<QueueEntry> {
        const historyItem = {...value, id : value.pid};
        await super.setItem(value.pid, historyItem)
        const history : QueueEntry[] = await this.all();
        socketService.emit('history', history);
        return value;
    }

    async removeItem(id: string): Promise<void> {
        let all = await this.all();
        all = all.filter(({pid}) => id != pid);
        await this.storage.setItem(this.type, all);
    }
}

export default new HistoryService('history');
