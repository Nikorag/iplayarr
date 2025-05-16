import { Request, Response, Router } from 'express';

import statisticsService from '../../service/stats/StatisticsService';

const router = Router();

router.get('/searchHistory', async (req: Request, res: Response) => {
    const { limit, filterRss } = req.query as any as { limit?: number, filterRss?: boolean };
    let searchHistory = await statisticsService.getSearchHistory();
    searchHistory = filterRss ? searchHistory.filter(({ term }) => term != '*') : searchHistory;
    res.json(limit ? searchHistory.slice(limit * -1) : searchHistory);
});

router.get('/grabHistory', async (req: Request, res: Response) => {
    const { limit } = req.query as any as { limit?: number };
    const grabHistory = await statisticsService.getGrabHistory();
    res.json(limit ? grabHistory.slice(limit * -1) : grabHistory);
});

export default router;