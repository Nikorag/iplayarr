import { ChildProcess, spawn } from 'child_process';

import { IplayarrParameter } from '../shared/types/enums/IplayarrParameters';
import { QueueEntry } from '../shared/types/models/QueueEntry'
import { VideoType } from '../shared/types/responses/iplayer/IPlayerSearchResult';
import { QueueEntryStatus } from '../shared/types/responses/sabnzbd/QueueResponse';
import AbstractExposedService from './abstractExposedService';
import configService from './configService';
import iplayerService from './iplayerService';
import socketService from './socketService';

let queue : QueueEntry[] = [];

class QueueService extends AbstractExposedService<string, QueueEntry> {
    async getItem(pid: string): Promise<QueueEntry | undefined> {
        return queue.find(({pid : queuePid}) => queuePid == pid);
    }
    async setItem(_: string | undefined, entry: QueueEntry): Promise<QueueEntry> {
        queue.push(entry);
        this.moveQueue();
        return entry;
    }
    async updateItem(pid: string, {details}: Partial<QueueEntry>): Promise<QueueEntry | undefined> {
        const index : number = queue.findIndex(({pid: id}) => id == pid);
        if (index > -1){
            queue[index].details = {...queue[index].details, ...details};
        }
        socketService.emit('queue', queue);
        return queue[index];
    }
    async removeItem(pid: string): Promise<void> {
        queue = queue.filter(({pid: id}) => id != pid);
        this.moveQueue();
    }
    async all(): Promise<QueueEntry[]> {
        return queue;
    }

    addToQueue(pid : string, nzbName : string, type : VideoType, appId? : string) : void {
        const queueEntry : QueueEntry = {
            id : pid,
            pid,
            status : QueueEntryStatus.QUEUED,
            nzbName,
            details : {},
            type,
            appId
        }
        this.setItem(pid, queueEntry);
    }

    async moveQueue() : Promise<void> {
        const activeLimit : number = parseInt(await configService.getItem(IplayarrParameter.ACTIVE_LIMIT) as string);
        
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
    }

    async cancelItem(pid : string) : Promise<void> {
        for (const queueItem of queue){
            if (queueItem.process && queueItem.pid == pid){
                spawn('kill', ['-9', String(queueItem.process.pid)]);
            }
        }
        this.removeItem(pid);
    }
}

export default new QueueService();