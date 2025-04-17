import { Request, Response, Router } from 'express';
import nzbFacade from 'src/facade/nzbFacade';
import AppsRoute from 'src/routes/json-api/AppsRoute';
import OffScheduleRoute from 'src/routes/json-api/OffScheduleRoute';
import QueueRoute from 'src/routes/json-api/QueueRoute';
import SettingsRoute from 'src/routes/json-api/SettingsRoute';
import SynonymsRoute from 'src/routes/json-api/SynonymsRoute';
import iplayerService from 'src/service/iplayerService';
import queueService from 'src/service/queueService';
import searchService from 'src/service/searchService';
import { IPlayerSearchResult } from 'src/types/data/IPlayerSearchResult';
import { ApiError, ApiResponse } from 'src/types/responses/ApiResponse';

const router : Router = Router();

router.use('/config', SettingsRoute);
router.use('/synonym', SynonymsRoute);
router.use('/queue', QueueRoute);
router.use('/offSchedule', OffScheduleRoute);
router.use('/apps', AppsRoute)

router.post('/nzb/test', async (req : Request, res : Response) => {
    const {NZB_URL, NZB_API_KEY, NZB_TYPE, NZB_USERNAME, NZB_PASSWORD} = req.body;
    const result : string | boolean = await nzbFacade.testConnection(NZB_TYPE, NZB_URL, NZB_API_KEY, NZB_USERNAME, NZB_PASSWORD);
    if (result == true){
        res.json({status : true});
    } else {
        res.status(500).json({error: ApiError.INTERNAL_ERROR, message : result} as ApiResponse)
    }
});

router.get('/search', async (req : Request, res : Response) => {
    const {q} = req.query as any;
    const result : IPlayerSearchResult[] = await searchService.search(q);
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
