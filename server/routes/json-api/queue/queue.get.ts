import { defineEventHandler } from 'h3';

import queueService from '../../../service/queueService';
import { QueueEntry } from '../../../types/QueueEntry';

export default defineEventHandler(() => {
    const queue: QueueEntry[] = queueService.getQueue() || [];
    return queue;
});
