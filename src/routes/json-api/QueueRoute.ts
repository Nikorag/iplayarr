import { Request, Response, Router } from 'express';

import historyService from '../../service/historyService';
import queueService from '../../service/queueService';
import socketService from '../../service/socketService';
import IPlayarrConstants from '../../types/constants/IPlayarrConstants';
import { QueueEntry } from '../../types/models/QueueEntry';
import CrudRoute from './CrudRoute';

const router = Router();

const historyRouter = new CrudRoute<QueueEntry>(historyService).router;

router.get('/queue', (_ : Request, res : Response) => {
    const queue : QueueEntry[] = queueService.getQueue() || [];
    res.json(queue);
});

router.delete('/queue', async (req : Request, res : Response) => {
    const { id } = req.body;
    queueService.cancelItem(id);
    const queue : QueueEntry[] = queueService.getQueue() || [];
    socketService.emit('queue', queue);
    res.json(queue);
});

router.post('/queue', (_, res : Response) => {
    res.status(501).json(IPlayarrConstants.NotImplementedError);
});

router.put('/queue', (_, res : Response) => {
    res.status(501).json(IPlayarrConstants.NotImplementedError);
});

router.use('/history', historyRouter);

export default router;