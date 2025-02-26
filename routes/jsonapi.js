import { Router } from "express";
import iplayerService from "../service/iplayerService.js";
import historyService from "../service/historyService.js";
import socketService from "../service/socketService.js";
import queueService from "../service/queueService.js";

const router = Router();

router.get('/queue', (_, res) => {
    const queue = queueService.getQueue() || [];
    res.json(queue);
});

router.get('/history', async (_, res) => {
    const history = await historyService.getHistory() || [];
    res.json(history);
});

router.delete('/history', async (req, res) => {
    const {pid} = req.query;
    await historyService.removeHistory(pid);
    const history = await historyService.getHistory() || [];
    socketService.emit("history", history);
    res.json(history);
})

router.delete('/queue', async (req, res) => {
    const {pid} = req.query;
    iplayerService.cancel(pid);
    const queue = iplayerService.getQueue() || [];
    socketService.emit("downloads", queue);
    res.json(queue);
})

export default router;