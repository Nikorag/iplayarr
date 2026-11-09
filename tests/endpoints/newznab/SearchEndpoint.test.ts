import { parseStringPromise } from 'xml2js';

import SearchEndpoint from '../../../server/endpoints/newznab/SearchEndpoint';
import searchFacade from '../../../server/facade/searchFacade';
import statisticsService from '../../../server/service/stats/StatisticsService';
import { VideoType } from '../../../server/types/IPlayerSearchResult';
import * as Utils from '../../../server/utils/Utils';
import { makeEvent, responseHeader } from '../../helpers/h3';

jest.mock('../../../server/facade/searchFacade');
jest.mock('../../../server/service/stats/StatisticsService');
jest.spyOn(Utils, 'getBaseUrl').mockReturnValue('http://localhost:3000');
jest.spyOn(Utils, 'createNZBDownloadLink').mockImplementation(() => Promise.resolve('/nzb/link.nzb'));

describe('SearchEndpoint', () => {
    let query: Record<string, string>;

    beforeEach(() => {
        query = {
            q: 'Test Show',
            season: '1',
            ep: '2',
            cat: '5000,5040',
            app: 'radarr',
            apikey: 'mockkey',
        };
    });

    it('responds with valid XML and logs search history', async () => {
        const fakeResults = [
            {
                pid: 'xyz123',
                type: VideoType.TV,
                nzbName: 'Test.Show.S01E02.720p',
                size: 1500,
                pubDate: new Date(),
            },
        ];

        (searchFacade.search as jest.Mock).mockResolvedValue(fakeResults);
        (statisticsService.addSearch as jest.Mock).mockImplementation(() => { });

        const event = makeEvent({ query });
        const xml = await SearchEndpoint(event);

        expect(responseHeader(event, 'content-type')).toBe('application/xml');
        expect(typeof xml).toBe('string');

        const parsed = await parseStringPromise(xml);
        expect(parsed).toHaveProperty('rss');
        expect(parsed.rss).toHaveProperty('channel');
        expect(parsed.rss.channel[0]).toHaveProperty('item');

        expect(searchFacade.search).toHaveBeenCalledWith('Test Show', '1', '2');
        expect(statisticsService.addSearch).toHaveBeenCalledWith({
            term: 'Test Show',
            results: 1,
            appId: 'radarr',
            series: '1',
            episode: '2',
            time: expect.any(Number)
        });
    });

    it('treats empty q as wildcard — calls searchFacade.search with * not empty string', async () => {
        // Regression test for: GET /api?t=search&q= closes connection instead of returning RSS feed.
        // Root cause: `q ?? '*'` does not catch empty string (only null/undefined).
        // Fix: `q || '*'` so '' also falls back to '*' (the schedule feed).
        query = { q: '', apikey: 'mockkey' };
        (searchFacade.search as jest.Mock).mockResolvedValue([]);
        (statisticsService.addSearch as jest.Mock).mockImplementation(() => {});

        const event = makeEvent({ query });
        const xml = await SearchEndpoint(event);

        // Must call search with '*', NOT with '' (empty string crashes NativeSearchService)
        expect(searchFacade.search).toHaveBeenCalledWith('*', undefined, undefined);
        // Must still send a valid XML response
        expect(responseHeader(event, 'content-type')).toBe('application/xml');
        expect(typeof xml).toBe('string');
    });
});
