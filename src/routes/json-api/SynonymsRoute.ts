import { Request, Response, Router } from 'express';

import arrFacade from '../../facade/arrFacade';
import appService from '../../service/appService';
import statisticsService from '../../service/stats/StatisticsService';
import synonymService from '../../service/synonymService';
import { App } from '../../types/App';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { ArrLookupResponse } from '../../types/responses/arr/ArrLookupResponse';
import { Synonym } from '../../types/Synonym';

const router = Router();

router.get('/', async (_, res: Response) => {
    const synonyms = await synonymService.getAllSynonyms();
    res.json(synonyms);
});

router.post('/', async (req: Request, res: Response) => {
    const synonym: Synonym = req.body as any as Synonym;
    await synonymService.addSynonym(synonym);
    const synonyms = await synonymService.getAllSynonyms();
    res.json(synonyms);
});

router.put('/', async (req: Request, res: Response) => {
    const synonym: Synonym = req.body as any as Synonym;
    await synonymService.updateSynonym(synonym);
    const synonyms = await synonymService.getAllSynonyms();
    res.json(synonyms);
});

router.delete('/', async (req: Request, res: Response) => {
    const { id } = req.body;
    await synonymService.removeSynonym(id);
    const synonyms = await synonymService.getAllSynonyms();
    res.json(synonyms);
});

router.get('/lookup/:appId', async (req: Request, res: Response) => {
    const { appId } = req.params as { appId: string };
    const { term } = req.query as { term?: string };

    const app: App | undefined = await appService.getApp(appId);
    if (app) {
        try {
            const results: ArrLookupResponse[] = await arrFacade.search(app, term);
            res.json(results);
            return;
        } catch (err: any) {
            const apiResponse: ApiResponse = {
                error: ApiError.INTERNAL_ERROR,
                message: err?.message,
            };
            res.status(400).json(apiResponse);
            return;
        }
    }
    const apiResponse: ApiResponse = {
        error: ApiError.INTERNAL_ERROR,
        message: `App ${appId} not found`,
    };
    res.status(400).json(apiResponse);
    return;
});

export default router;
