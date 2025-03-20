import { Request, Response } from 'express';

import episodeCacheService from '../../service/episodeCacheService';
import offScheduleService from '../../service/offScheduleService';
import { EpisodeCacheDefinition } from '../../shared/types/responses/iplayer/EpisodeCacheTypes';
import { OffScheduleFormValidator } from '../../validators/OffScheduleFormValidator';
import { AbstractStorageRoute } from './AbstractStorageRoute';

const router = new AbstractStorageRoute(offScheduleService, new OffScheduleFormValidator()).getRouter();

router.post('/refresh', async (req : Request, res : Response) => {
    const def : EpisodeCacheDefinition = req.body;
    episodeCacheService.recacheSeries(def);
    res.json({status : true});
});

export default router;