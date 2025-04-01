import { Request, Response, Router } from 'express';

import episodeCacheService from '../../service/episodeCacheService';
import { EpisodeCacheDefinition } from '../../types/models/EpisodeCacheDefinition';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { OffScheduleFormValidator } from '../../validators/OffScheduleFormValidator';
import { Validator } from '../../validators/Validator';

const router = Router();

router.get('/', async (_, res : Response) => {
    const cachedSeries : EpisodeCacheDefinition[] = await episodeCacheService.all();
    res.json(cachedSeries);
});

router.post('/', async (req : Request, res : Response) => {
    const validator : Validator = new OffScheduleFormValidator();
    const validationResult : {[key:string] : string} = await validator.validate(req.body);
    if (Object.keys(validationResult).length > 0){
        const apiResponse : ApiResponse = {
            error : ApiError.INVALID_INPUT,
            invalid_fields : validationResult
        }
        res.status(400).json(apiResponse);
        return;
    }

    const {name, url} = req.body;
    await episodeCacheService.setItem(undefined, {url, name});
    const cachedSeries : EpisodeCacheDefinition[] = await episodeCacheService.all();
    res.json(cachedSeries);
});

router.put('/', async (req : Request, res : Response) => {
    const validator : Validator = new OffScheduleFormValidator();
    const validationResult : {[key:string] : string} = await validator.validate(req.body);
    if (Object.keys(validationResult).length > 0){
        const apiResponse : ApiResponse = {
            error : ApiError.INVALID_INPUT,
            invalid_fields : validationResult
        }
        res.status(400).json(apiResponse);
        return;
    }
    
    const {name, url, id} = req.body;
    await episodeCacheService.updateItem(id, {id, url, name, cacheRefreshed : undefined});
    const cachedSeries : EpisodeCacheDefinition[] = await episodeCacheService.all();
    res.json(cachedSeries);
})

router.delete('/', async (req : Request, res : Response) => {
    const {id} = req.body;
    await episodeCacheService.removeItem(id);
    const cachedSeries : EpisodeCacheDefinition[] = await episodeCacheService.all();
    res.json(cachedSeries);
});

router.post('/refresh', async (req : Request, res : Response) => {
    const def : EpisodeCacheDefinition = req.body;
    episodeCacheService.recacheSeries(def);
    res.json({status : true});
});

export default router;