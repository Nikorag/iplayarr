// __tests__/NativeScheduleService.test.ts
import axios from 'axios';

import * as Utils from '../../../src//utils/Utils';
import configService from '../../../src/service/configService';
import iplayerDetailsService from '../../../src/service/iplayerDetailsService';
import loggingService from '../../../src/service/loggingService';
import NativeScheduleService from '../../../src/service/schedule/NativeScheduleService';
import NativeSearchService from '../../../src/service/search/NativeSearchService';

jest.mock('axios');
jest.mock('../../../src/service/configService');
jest.mock('../../../src/service/iplayerDetailsService');
jest.mock('../../../src/service/loggingService');
jest.mock('../../../src/service/redis/redisCacheService');
jest.mock('../../../src/service/search/NativeSearchService');
jest.mock('../../../src/utils/Utils', () => ({
    ...jest.requireActual('../../../src/utils/Utils'),
    getQualityProfile: jest.fn(),
    splitArrayIntoChunks: jest.fn(),
}));

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

            (NativeSearchService.createSearchResult as jest.Mock).mockResolvedValue({
                title: 'Test Show',
                pubDate: new Date().toISOString(),
            });

            const setMock = jest.fn();
            NativeScheduleService.scheduleCache.set = setMock;
            NativeScheduleService.cacheTime.set = setMock;

            await NativeScheduleService.refreshCache();

            expect(setMock).toHaveBeenCalledWith('schedule', expect.any(Array));
            expect(setMock).toHaveBeenCalledWith('last_cached', expect.any(Number));
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
