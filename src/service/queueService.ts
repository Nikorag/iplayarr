import { ChildProcess, spawn } from "child_process";
import { IplayarrParameter } from "../types/IplayarrParameters";
import { QueueEntry } from "../types/QueueEntry"
import { QueueEntryStatus, QueueStatus } from "../types/responses/sabnzbd/QueueResponse";
import { getParameter } from "./configService";
import iplayerService from "./iplayerService";
import socketService from "./socketService";
import { DownloadDetails } from "../types/DownloadDetails";

let queue : QueueEntry[] = [];

const queueService = {
    addToQueue : (pid : string, nzbName : string) : void => {
        const queueEntry : QueueEntry = {
            pid,
            status : QueueEntryStatus.QUEUED,
            nzbName,
            details : {}
        }
        queue.push(queueEntry);
        queueService.moveQueue();
    },

    moveQueue : async () : Promise<void> => {
        const activeLimit : number = parseInt(await getParameter(IplayarrParameter.ACTIVE_LIMIT) as string);
        
        let activeQueue : QueueEntry[] = queue.filter(({ status }) => status == QueueEntryStatus.DOWNLOADING);
        let idleQueue : QueueEntry[] = queue.filter(({ status }) => status == QueueEntryStatus.QUEUED);
        while(activeQueue.length < activeLimit && idleQueue.length > 0){
            const next = idleQueue.shift() as QueueEntry;

            const downloadProcess : ChildProcess = await iplayerService.download(next.pid);
            next.status = QueueEntryStatus.DOWNLOADING;
            next.process = downloadProcess;
            next.details = {...next.details, start : new Date()};

            activeQueue.push(next);

            queue = [...activeQueue, ...idleQueue];
            activeQueue = queue.filter(({ status }) => status == QueueEntryStatus.DOWNLOADING);
            idleQueue = queue.filter(({status}) => status == QueueEntryStatus.QUEUED);
        }
        socketService.emit('queue', queue);
    },

    updateQueue: (pid : string, details: Partial<DownloadDetails>) => {
        const index : number = queue.findIndex(({pid: id}) => id == pid);
        if (index > -1){
            queue[index].details = {...queue[index].details, ...details};
        }
        socketService.emit('queue', queue);
    },

    removeFromQueue: (pid : string) : void => {
        queue = queue.filter(({pid: id}) => id != pid);
        queueService.moveQueue();
    },

    cancelItem: (pid : string) : void => {
        for (const queueItem of queue){
            if (queueItem.process && queueItem.pid == pid){
                spawn('kill', ['-9', String(queueItem.process.pid)]);
            }
        }
        queueService.removeFromQueue(pid);
    },

    getQueue: () : QueueEntry[] => {
        return queue;
    },

    getFromQueue: (pid : string) : QueueEntry | undefined => {
        return queue.find(({pid : queuePid}) => queuePid == pid);
    }
}

export default queueService;