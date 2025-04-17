import { Request, Response, Router } from 'express';
import historyService from 'src/service/entity/historyService';
import queueService from 'src/service/queueService';
import socketService from 'src/service/socketService';
import { QueueEntry } from 'src/types/models/QueueEntry';

const router = Router();

interface DeleteRequest {
    pid : string
}

router.get('/queue', (_ : Request, res : Response) => {
    const queue : QueueEntry[] = queueService.getQueue() || [];
    res.json(queue);
});

router.get('/history', async (_ : Request, res : Response) => {
    const history : QueueEntry[] = await historyService.all() || [];
    res.json(history);
});

router.delete('/history', async (req : Request, res : Response) => {
    const {pid} = req.query as any as DeleteRequest;
    await historyService.removeItem(pid);
    const history = await historyService.all() || [];
    socketService.emit('history', history);
    res.json(history);
});

router.delete('/queue', async (req : Request, res : Response) => {
    const {pid} = req.query as any as DeleteRequest;
    queueService.cancelItem(pid);
    const queue : QueueEntry[] = queueService.getQueue() || [];
    socketService.emit('queue', queue);
    res.json(queue);
});

export default router;