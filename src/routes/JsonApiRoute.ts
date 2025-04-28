import { Request, Response, Router } from 'express';

import nzbFacade from '../facade/nzbFacade';
import iplayerService from '../service/iplayerService';
import queueService from '../service/queueService';
import searchService from '../service/searchService';
import { IPlayerSearchResult } from '../types/IPlayerSearchResult';
import { ApiError, ApiResponse } from '../types/responses/ApiResponse';
import AppsRoute from './json-api/AppsRoute';
import OffScheduleRoute from './json-api/OffScheduleRoute';
import QueueRoute from './json-api/QueueRoute';
import SettingsRoute from './json-api/SettingsRoute';
import SynonymsRoute from './json-api/SynonymsRoute';

const router: Router = Router();

router.use('/config', SettingsRoute);
router.use('/synonym', SynonymsRoute);
router.use('/queue', QueueRoute);
router.use('/offSchedule', OffScheduleRoute);
router.use('/apps', AppsRoute);

router.post('/nzb/test', async (req: Request, res: Response) => {
    const { NZB_URL, NZB_API_KEY, NZB_TYPE, NZB_USERNAME, NZB_PASSWORD } = req.body;
    const result: string | boolean = await nzbFacade.testConnection(
        NZB_TYPE,
        NZB_URL,
        NZB_API_KEY,
        NZB_USERNAME,
        NZB_PASSWORD
    );
    if (result == true) {
        res.json({ status: true });
    } else {
        res.status(500).json({ error: ApiError.INTERNAL_ERROR, message: result } as ApiResponse);
    }
});

router.get('/search', async (req: Request, res: Response) => {
    const { q } = req.query as any;
    const result: IPlayerSearchResult[] = await searchService.search(q);
    res.json(result);
});

router.get('/details', async (req: Request, res: Response) => {
    const { pid } = req.query as any;
    const details = await iplayerService.details([pid]);
    res.json(details[0]);
});

router.get('/download', async (req: Request, res: Response) => {
    const { pid, nzbName, type } = req.query as any;
    queueService.addToQueue(pid, nzbName, type);
    res.json({ status: true });
});

router.get('/cache-refresh', async (_, res: Response) => {
    iplayerService.refreshCache();
    res.json({ status: true });
});

export default router;
