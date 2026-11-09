import { defineEventHandler } from 'h3';

import historyService from '../../../service/historyService';
import { QueueEntry } from '../../../types/QueueEntry';

export default defineEventHandler(async () => {
    const history: QueueEntry[] = (await historyService.getHistory()) || [];
    return history;
});
