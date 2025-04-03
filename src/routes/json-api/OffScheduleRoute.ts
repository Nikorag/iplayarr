import { Request, Response } from 'express';

import episodeCacheService from '../../service/episodeCacheService';
import { EpisodeCacheDefinition } from '../../types/models/EpisodeCacheDefinition';
import { OffScheduleFormValidator } from '../../validators/OffScheduleFormValidator';
import CrudRoute from './CrudRoute';

const router = new CrudRoute<EpisodeCacheDefinition>(episodeCacheService, new OffScheduleFormValidator()).router;

router.post('/refresh', async (req : Request, res : Response) => {
    const def : EpisodeCacheDefinition = req.body;
    episodeCacheService.recacheSeries(def);
    res.json({status : true});
});

export default router;