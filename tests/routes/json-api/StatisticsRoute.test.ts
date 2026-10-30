import request from 'supertest';

import getCacheSizes from '../../../server/routes/json-api/stats/cacheSizes.get';
import getGrabHistory from '../../../server/routes/json-api/stats/grabHistory.get';
import getSearchHistory from '../../../server/routes/json-api/stats/searchHistory.get';
import getUptime from '../../../server/routes/json-api/stats/uptime.get';
import statisticsService from '../../../server/service/stats/StatisticsService';
import { nodeApp } from '../../helpers/h3';

jest.mock('../../../server/service/stats/StatisticsService');

const expressApp = nodeApp([
    ['get', '/searchHistory', getSearchHistory],
    ['get', '/grabHistory', getGrabHistory],
    ['get', '/uptime', getUptime],
    ['get', '/cacheSizes', getCacheSizes],
]);

describe('Statistics Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /searchHistory', () => {
        it('returns search history', async () => {
            const history = ['search1', 'search2'];
            (statisticsService.getSearchHistory as jest.Mock).mockReturnValue(history);

            const res = await request(expressApp).get('/searchHistory');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(history);
        });

        it('returns limited search history', async () => {
            const history = ['search1', 'search2'];
            (statisticsService.getSearchHistory as jest.Mock).mockReturnValue(history);

            const res = await request(expressApp).get('/searchHistory?limit=1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([history[1]]);
        });

        it('returns filtered search history', async () => {
            const filteredHistory = [{ 'term': 'search1' }, { 'term': 'search2' }]
            const history = [...filteredHistory, { 'term': '*' }];
            (statisticsService.getSearchHistory as jest.Mock).mockReturnValue(history);

            const unfilteredRes = await request(expressApp).get('/searchHistory');
            expect(unfilteredRes.status).toBe(200);
            expect(unfilteredRes.body).toEqual(history);

            const filteredRes = await request(expressApp).get('/searchHistory?filterRss=true');
            expect(filteredRes.status).toBe(200);
            expect(filteredRes.body).toEqual(filteredHistory);
        });
    });

    describe('GET /grabHistory', () => {
        it('returns grab history', async () => {
            const history = ['grab1', 'grab2'];
            (statisticsService.getGrabHistory as jest.Mock).mockReturnValue(history);

            const res = await request(expressApp).get('/grabHistory');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(history);
        });

        it('returns limited grab history', async () => {
            const history = ['grab1', 'grab2'];
            (statisticsService.getGrabHistory as jest.Mock).mockReturnValue(history);

            const res = await request(expressApp).get('/grabHistory?limit=1');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([history[1]]);
        });
    });

    describe('GET /uptime', () => {
        it('returns uptime', async () => {
            const uptime = 100;
            (statisticsService.getUptime as jest.Mock).mockReturnValue(uptime);

            const res = await request(expressApp).get('/uptime');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ uptime });
        });
    });

    describe('GET /cacheSizes', () => {
        it('returns cacheSizes', async () => {
            const cacheSizes = { search: 100, schedule: 500 };

            (statisticsService.getCacheSizes as jest.Mock).mockReturnValue(cacheSizes);

            const res = await request(expressApp).get('/cacheSizes');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(cacheSizes);
        });
    });
});