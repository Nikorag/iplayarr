import { Request, Response, Router } from 'express';

import appService from '../../service/appService';
import arrService from '../../service/arrService';
import searchHistoryService from '../../service/searchHistoryService';
import synonymService from '../../service/synonymService';
import { App } from '../../types/models/App';
import { Synonym } from '../../types/models/Synonym';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { ArrLookupResponse } from '../../types/responses/arr/ArrLookupResponse';
import CrudRoute from './CrudRoute';

const router : Router = new CrudRoute<Synonym>(synonymService).router;

router.get('/searchHistory', async (req : Request, res : Response) => {
    const searchHistory = searchHistoryService.getHistory();
    res.json(searchHistory);
});

router.get('/lookup/:appId', async (req : Request, res : Response) => {
    const {appId} = req.params as {appId : string};
    const {term} = req.query as {term? : string};
    
    const app : App | undefined = await appService.getItem(appId);
    if (app){
        try {
            const results : ArrLookupResponse[] = await arrService.search(app, term);
            res.json(results);
            return;
        } catch (err : any) {
            const apiResponse : ApiResponse = {
                error : ApiError.INTERNAL_ERROR,
                message : err?.message
            }
            res.status(400).json(apiResponse);
            return;
        }
    }
    const apiResponse : ApiResponse = {
        error : ApiError.INTERNAL_ERROR,
        message : `App ${appId} not found`
    }
    res.status(400).json(apiResponse);
    return;
})

export default router;