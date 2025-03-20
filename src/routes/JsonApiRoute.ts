import { Request, Response, Router } from 'express';

import historyService from '../service/historyService';
import iplayerService from '../service/iplayerService';
import queueService from '../service/queueService';
import { IPlayerSearchResult } from '../shared/types/responses/iplayer/IPlayerSearchResult';
import { AbstractStorageRoute } from './json-api/AbstractStorageRoute';
import AppsRoute from './json-api/AppsRoute';
import OffScheduleRoute from './json-api/OffScheduleRoute';
import QueueRoute from './json-api/QueueRoute';
import SettingsRoute from './json-api/SettingsRoute';
import SynonymsRoute from './json-api/SynonymsRoute';

import { createRoutes } from './RouteUtils';

const router : Router = Router();

createRoutes(router)

router.get('/search', async (req : Request, res : Response) => {
    const {q} = req.query as any;
    const result : IPlayerSearchResult[] = await iplayerService.search(q);
    res.json(result);
});

router.get('/details', async (req : Request, res : Response) => {
    const {pid} = req.query as any;
    const details = await iplayerService.details([pid]);
    res.json(details[0]);
});

router.get('/download', async (req : Request, res : Response) => {
    const {pid, nzbName, type} = req.query as any;
    queueService.addToQueue(pid, nzbName, type);
    res.json({status : true})
});

router.get('/cache-refresh', async (_, res : Response) => {
    iplayerService.refreshCache();
    res.json({status : true});
});

export default router;
