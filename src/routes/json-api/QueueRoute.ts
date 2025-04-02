import { Request, Response, Router } from 'express';

import historyService from '../../service/historyService';
import queueService from '../../service/queueService';
import socketService from '../../service/socketService';
import { QueueEntry } from '../../types/models/QueueEntry';
import CrudRoute from './CrudRoute';

const router = Router();

const historyRouter = new CrudRoute<QueueEntry>(historyService).router;

interface DeleteRequest {
    pid : string
}

router.get('/queue', (_ : Request, res : Response) => {
    const queue : QueueEntry[] = queueService.getQueue() || [];
    res.json(queue);
});

router.delete('/queue', async (req : Request, res : Response) => {
    const {pid} = req.query as any as DeleteRequest;
    queueService.cancelItem(pid);
    const queue : QueueEntry[] = queueService.getQueue() || [];
    socketService.emit('queue', queue);
    res.json(queue);
});

router.use('/history', historyRouter);

export default router;