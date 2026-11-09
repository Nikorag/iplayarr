import { defineEventHandler, getQuery } from 'h3';

import queueService from '../../../service/queueService';
import socketService from '../../../service/socketService';
import { QueueEntry } from '../../../types/QueueEntry';

export default defineEventHandler((event) => {
    const { pid } = getQuery(event) as { pid: string };
    queueService.cancelItem(pid);
    const queue: QueueEntry[] = queueService.getQueue() || [];
    socketService.emit('queue', queue);
    return queue;
});
