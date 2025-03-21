import { QueueEntry } from '../types/models/QueueEntry';
import AbstractStorageService from './abstractStorageService';
import socketService from './socketService';

class HistoryService extends AbstractStorageService<QueueEntry> {
    async setItem(id: string | undefined, item: QueueEntry): Promise<QueueEntry> {
        const historyItem : QueueEntry = {...item, details : {...item.details, eta: '', speed: 0, progress: 100}, process : undefined};
        const response = super.setItem(id, historyItem);
        const history : QueueEntry[] = await this.all();
        socketService.emit('history', history);
        return response;
    }

    async removeItem(id: string): Promise<void> {
        super.removeItem(id);
        const history : QueueEntry[] = await this.all();
        socketService.emit('history', history);
    }
}

export default new HistoryService('history');
