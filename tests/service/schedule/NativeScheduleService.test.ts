// __tests__/NativeScheduleService.test.ts
import axios from 'axios';

import configService from '../../../server/service/configService';
import iplayerDetailsService from '../../../server/service/iplayerDetailsService';
import loggingService from '../../../server/service/loggingService';
import NativeScheduleService from '../../../server/service/schedule/NativeScheduleService';
import NativeSearchService from '../../../server/service/search/NativeSearchService';
import synonymService from '../../../server/service/synonymService';
import * as Utils from '../../../server/utils/Utils';

jest.mock('axios');
jest.mock('../../../server/service/configService');
jest.mock('../../../server/service/iplayerDetailsService');
jest.mock('../../../server/service/loggingService');
jest.mock('../../../server/service/cache/cacheService');
jest.mock('../../../server/service/search/NativeSearchService');
jest.mock('../../../server/utils/Utils');
jest.mock('../../../server/service/synonymService');

describe('NativeScheduleService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('refreshCache', () => {
        it('should fetch, process, and cache schedule data', async () => {
            (Utils.getQualityProfile as jest.Mock).mockResolvedValue({ sizeFactor: 1 });
            (configService.getParameter as jest.Mock).mockResolvedValue('24');
            (iplayerDetailsService.details as jest.Mock).mockResolvedValue([{ title: 'Test Show' }]);
            (Utils.splitArrayIntoChunks as jest.Mock).mockImplementation(pids => [pids]);
            jest.spyOn(synonymService, 'getSynonym').mockResolvedValue(undefined);

            (NativeSearchService.createSearchResult as jest.Mock).mockResolvedValue({
                title: 'Test Show',
                pubDate: new Date().toISOString(),
            });

            const setMock = jest.fn();
            NativeScheduleService.scheduleCache.set = setMock;
            NativeScheduleService.cacheTime.set = setMock;

            await NativeScheduleService.refreshCache();

            expect(NativeSearchService.createSearchResult).toHaveBeenCalledWith(
                'Test Show',
                { title: 'Test Show' },
                1,
                undefined
            );
            expect(setMock).toHaveBeenCalledWith('schedule', expect.any(Array));
            expect(setMock).toHaveBeenCalledWith('last_cached', expect.any(Number));
        });

        it('should look up and pass synonym to createSearchResult', async () => {
            (Utils.getQualityProfile as jest.Mock).mockResolvedValue({ sizeFactor: 1 });
            (configService.getParameter as jest.Mock).mockResolvedValue('24');
            (iplayerDetailsService.details as jest.Mock).mockResolvedValue([{ title: 'Test Show' }]);
            (Utils.splitArrayIntoChunks as jest.Mock).mockImplementation(pids => [pids]);
            jest.spyOn(synonymService, 'getSynonym').mockResolvedValue({
                id: 'syn-1',
                from: 'From',
                target: 'Test Show',
                filenameOverride: 'Test Show Override',
                exemptions: ''
            });

            (NativeSearchService.createSearchResult as jest.Mock).mockResolvedValue({
                title: 'Test Show',
                pubDate: new Date().toISOString(),
            });

            const setMock = jest.fn();
            NativeScheduleService.scheduleCache.set = setMock;
            NativeScheduleService.cacheTime.set = setMock;

            await NativeScheduleService.refreshCache();

            expect(synonymService.getSynonym).toHaveBeenCalledWith('Test Show');
            expect(NativeSearchService.createSearchResult).toHaveBeenCalledWith(
                'Test Show',
                { title: 'Test Show' },
                1,
                expect.objectContaining({ target: 'Test Show', filenameOverride: 'Test Show Override' })
            );
        });
    });

    describe('getFeed', () => {
        it('should refresh cache if stale and return cached results', async () => {
            const now = Date.now();
            NativeScheduleService.cacheTime.get = jest.fn().mockResolvedValue(now - 2701 * 1000);
            const refreshSpy = jest.spyOn(NativeScheduleService, 'refreshCache').mockResolvedValue();
            NativeScheduleService.scheduleCache.get = jest.fn().mockResolvedValue([
                { title: 'Show', pubDate: new Date().toISOString() },
            ]);

            const results = await NativeScheduleService.getFeed();

            expect(refreshSpy).toHaveBeenCalled();
            expect(results).toEqual(expect.any(Array));
        });

        it('should log error and return empty array if cache is empty', async () => {
            NativeScheduleService.cacheTime.get = jest.fn().mockResolvedValue(Date.now());
            NativeScheduleService.scheduleCache.get = jest.fn().mockResolvedValue(null);

            const errorMock = jest.spyOn(loggingService, 'error').mockImplementation(jest.fn());

            const results = await NativeScheduleService.getFeed();

            expect(errorMock).toHaveBeenCalledWith('No results found in schedule cache');
            expect(results).toEqual([]);
        });
    });

    describe('getPidsFromSchedulePage', () => {
        it('should parse PIDs from a mocked schedule page', async () => {
            const html = `
        <html>
          <body>
            <div class="programme__titles">
                <a href="/programmes/abc123" aria-label="27 Apr 07:00: Test show"></a>
            </div
          </body>
        </html>
      `;
            (axios.get as jest.Mock).mockResolvedValue({ data: html });

            const pids = await NativeScheduleService.getPidsFromSchedulePage('https://mocked-url');

            expect(pids).toContain('abc123');
        });

        it('should return empty array on error', async () => {
            (axios.get as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

            const logSpy = jest.spyOn(loggingService, 'error').mockImplementation(jest.fn());

            const pids = await NativeScheduleService.getPidsFromSchedulePage('bad-url');

            expect(pids).toEqual([]);
            expect(logSpy).toHaveBeenCalled();
        });
    });
});
