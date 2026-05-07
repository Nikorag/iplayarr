import { QueuedStorage } from '../types/QueuedStorage';
import { HistoryEntry, QueueEntry } from '../types/QueueEntry';
import { QueueEntryStatus } from '../types/responses/sabnzbd/QueueResponse';
import socketService from './socketService';
const storage: QueuedStorage = new QueuedStorage();

const historyService = {
    getHistory: async (): Promise<HistoryEntry[]> => {
        return (await storage.getItem('history')) ?? [];
    },

    addHistory: async (item: QueueEntry): Promise<void> => {
        const historyItem: HistoryEntry = {
            ...item,
            status: QueueEntryStatus.COMPLETE,
            details: { ...item.details, eta: '', speed: 0, progress: 100 },
            process: undefined,
            completedAt: new Date().toISOString(),
        };
        const history: HistoryEntry[] = await historyService.getHistory();
        history.push(historyItem);
        await storage.setItem('history', history);
        socketService.emit('history', history);
    },

    addRelay: async (item: QueueEntry): Promise<void> => {
        const history: HistoryEntry[] = await historyService.getHistory();
        history.push(item);
        await storage.setItem('history', history);
        socketService.emit('history', history);
    },

    addArchive: async (item: HistoryEntry, status: QueueEntryStatus = QueueEntryStatus.CANCELLED): Promise<void> => {
        const historyItem: HistoryEntry = {
            ...item,
            status,
            details: { ...item.details, eta: '', speed: 0, progress: 100 },
            process: undefined,
            archivedAt: new Date().toISOString(),
            completedAt: item.completedAt,
        };
        const history: HistoryEntry[] = await historyService.getHistory();
        history.push(historyItem);
        await storage.setItem('history', history);
        socketService.emit('history', history);
    },

    removeHistory: async (pid: string, archive: boolean = false): Promise<void> => {
        let history: HistoryEntry[] = await historyService.getHistory();
        const historyItem = history.find(({ pid: historyPid }) => historyPid === pid);
        history = history.filter(({ pid: historyPid }) => historyPid !== pid);
        await storage.setItem('history', history);
        socketService.emit('history', history);
        if (historyItem && archive) {
            historyService.addArchive(historyItem, QueueEntryStatus.REMOVED);
        }
    },
};

export default historyService;
