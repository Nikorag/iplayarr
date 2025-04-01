import { QueuedStorage } from '../types/QueuedStorage'
import { QueueEntry } from '../types/QueueEntry';
import { QueueEntryStatus } from '../types/responses/sabnzbd/QueueResponse';
import socketService from './socketService';
const storage : QueuedStorage = new QueuedStorage();

let isStorageInitialized : boolean = false;

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}

const historyService = {
    getHistory : async() : Promise<QueueEntry[]> => {
        if (!isStorageInitialized) {
            await storage.init(storageOptions);
            isStorageInitialized = true;
        }
        return (await storage.getItem('history')) ?? [];
    },

    addHistory : async(item : QueueEntry) : Promise<void> => {
        const historyItem : QueueEntry = {...item, status: QueueEntryStatus.COMPLETE, details : {...item.details, eta: '', speed: 0, progress: 100}, process : undefined};
        const history : QueueEntry[] = await historyService.getHistory();
        history.push(historyItem);
        await storage.setItem('history', history);
        socketService.emit('history', history);
    },

    addRelay : async(item : QueueEntry) : Promise<void> => {
        const history : QueueEntry[] = await historyService.getHistory();
        history.push(item);
        await storage.setItem('history', history);
        socketService.emit('history', history);
    },

    removeHistory : async(pid : string) : Promise<void> => {
        let history : QueueEntry[] = await historyService.getHistory();
        history = history.filter(({pid : historyPid}) => historyPid !== pid);
        await storage.setItem('history', history);
        socketService.emit('history', history);
    }
}

export default historyService;
