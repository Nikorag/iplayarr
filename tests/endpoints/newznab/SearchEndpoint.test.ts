import { Request, Response } from 'express';
import { parseStringPromise } from 'xml2js';

import SearchEndpoint from '../../../src/endpoints/newznab/SearchEndpoint';
import searchFacade from '../../../src/facade/searchFacade';
import statisticsService from '../../../src/service/stats/StatisticsService';
import { VideoType } from '../../../src/types/IPlayerSearchResult';
import * as Utils from '../../../src/utils/Utils';

jest.mock('../../../src/facade/searchFacade');
jest.mock('../../../src/service/stats/StatisticsService');
jest.spyOn(Utils, 'getBaseUrl').mockReturnValue('http://localhost:3000');
jest.spyOn(Utils, 'createNZBDownloadLink').mockImplementation(() => Promise.resolve('/nzb/link.nzb'));

describe('SearchEndpoint', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let sendMock: jest.Mock;
    let setMock: jest.Mock;

    beforeEach(() => {
        sendMock = jest.fn();
        setMock = jest.fn();
        req = {
            query: {
                q: 'Test Show',
                season: '1',
                ep: '2',
                cat: '5000,5040',
                app: 'radarr',
                apikey: 'mockkey',
            },
        };
        res = {
            set: setMock,
            send: sendMock,
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

        await SearchEndpoint(req as Request, res as Response);

        expect(setMock).toHaveBeenCalledWith('Content-Type', 'application/xml');
        expect(sendMock).toHaveBeenCalled();

        const xml = sendMock.mock.calls[0][0];
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
});
