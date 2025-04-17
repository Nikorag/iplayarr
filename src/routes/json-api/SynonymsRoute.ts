import { Request, Response, Router } from 'express';
import arrService from 'src/service/arrService';
import appService from 'src/service/entity/appService';
import synonymService from 'src/service/entity/synonymService';
import searchHistoryService from 'src/service/searchHistoryService';
import { App } from 'src/types/models/App';
import { Synonym } from 'src/types/models/Synonym';
import { ApiError, ApiResponse } from 'src/types/responses/ApiResponse';
import { ArrLookupResponse } from 'src/types/responses/arr/ArrLookupResponse';

const router = Router();

router.get('/', async (_, res : Response) => {
    const synonyms = await synonymService.all();
    res.json(synonyms);
});

router.post('/', async (req : Request, res : Response) => {
    const synonym : Synonym = req.body as any as Synonym;
    await synonymService.setItem(synonym.id, synonym);
    const synonyms = await synonymService.all();
    res.json(synonyms);
});

router.put('/', async (req : Request, res : Response) => {
    const synonym : Synonym = req.body as any as Synonym;
    await synonymService.updateItem(synonym.id, synonym);
    const synonyms = await synonymService.all();
    res.json(synonyms);
});

router.delete('/', async (req : Request, res : Response) => {
    const {id} = req.body;
    await synonymService.removeItem(id);
    const synonyms = await synonymService.all();
    res.json(synonyms);
});

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