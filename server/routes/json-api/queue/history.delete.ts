import { defineEventHandler, getQuery } from 'h3';

import historyService from '../../../service/historyService';
import socketService from '../../../service/socketService';

export default defineEventHandler(async (event) => {
    const { pid } = getQuery(event) as { pid: string };
    await historyService.removeHistory(pid);
    const history = (await historyService.getHistory()) || [];
    socketService.emit('history', history);
    return history;
});
