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
        // The service is a singleton, so clear state left over from earlier tests
        NativeScheduleService.caching = false;
        NativeScheduleService.lastRefreshAttempt = 0;
        NativeScheduleService.failedPages = 0;
        NativeScheduleService.retryBaseDelayMs = 0;
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

    describe('refreshCache resilience', () => {
        const recent = (pid: string, hoursAgo = 1) => ({
            pid,
            title: pid,
            pubDate: new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString(),
        });

        const arrange = (previous: any[] | undefined) => {
            (Utils.getQualityProfile as jest.Mock).mockResolvedValue({ sizeFactor: 1 });
            (configService.getParameter as jest.Mock).mockResolvedValue('24');
            (Utils.splitArrayIntoChunks as jest.Mock).mockImplementation((pids: string[]) => (pids.length ? [pids] : []));
            (iplayerDetailsService.details as jest.Mock).mockResolvedValue([]);
            jest.spyOn(synonymService, 'getSynonym').mockResolvedValue(undefined);
            NativeScheduleService.scheduleCache.get = jest.fn().mockResolvedValue(previous);
            const feedSet = jest.fn();
            const timeSet = jest.fn();
            NativeScheduleService.scheduleCache.set = feedSet;
            NativeScheduleService.cacheTime.set = timeSet;
            return { feedSet, timeSet };
        };

        it('skips a refresh while another is still running', async () => {
            const { feedSet } = arrange(undefined);
            NativeScheduleService.caching = true;

            await NativeScheduleService.refreshCache();

            expect(feedSet).not.toHaveBeenCalled();
            expect(Utils.getQualityProfile).not.toHaveBeenCalled();
        });

        it('releases the in-progress flag when a refresh throws', async () => {
            arrange(undefined);
            (Utils.getQualityProfile as jest.Mock).mockRejectedValue(new Error('db down'));

            await expect(NativeScheduleService.refreshCache()).rejects.toThrow('db down');

            expect(NativeScheduleService.caching).toBe(false);
        });

        it('keeps the previous feed when every schedule page failed', async () => {
            const { feedSet, timeSet } = arrange([recent('keep-me')]);
            (axios.get as jest.Mock).mockRejectedValue(new Error('boom'));
            jest.spyOn(loggingService, 'error').mockImplementation(jest.fn());

            await NativeScheduleService.refreshCache();

            expect(NativeScheduleService.failedPages).toBeGreaterThan(0);
            // The merged feed is exactly the previous one, nothing was lost
            expect(feedSet).toHaveBeenCalledWith('schedule', [expect.objectContaining({ pid: 'keep-me' })]);
            // ...and it is due another refresh well before the normal interval
            const [, lastCached] = timeSet.mock.calls[0];
            expect(lastCached).toBeLessThan(Date.now() - 2000 * 1000);
        });

        it('drops previous programmes that are older than the RSS window when filling gaps', async () => {
            const { feedSet } = arrange([recent('fresh', 2), recent('ancient', 100)]);
            (axios.get as jest.Mock).mockRejectedValue(new Error('boom'));
            jest.spyOn(loggingService, 'error').mockImplementation(jest.fn());

            await NativeScheduleService.refreshCache();

            const [, feed] = feedSet.mock.calls[0];
            expect(feed.map((r: any) => r.pid)).toEqual(['fresh']);
        });

        it('does not wipe a good feed when nothing at all was found', async () => {
            const { feedSet, timeSet } = arrange([recent('a', 100)]);
            (axios.get as jest.Mock).mockRejectedValue(new Error('boom'));
            jest.spyOn(loggingService, 'error').mockImplementation(jest.fn());

            await NativeScheduleService.refreshCache();

            expect(feedSet).not.toHaveBeenCalled();
            expect(timeSet).toHaveBeenCalledWith('last_cached', expect.any(Number));
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

    describe('getFeed background refresh', () => {
        const staleFeed = () => {
            NativeScheduleService.cacheTime.get = jest.fn().mockResolvedValue(Date.now() - 3000 * 1000);
            NativeScheduleService.scheduleCache.get = jest.fn().mockResolvedValue([]);
        };

        it('reports a failed background refresh instead of leaving an unhandled rejection', async () => {
            staleFeed();
            const errorMock = jest.spyOn(loggingService, 'error').mockImplementation(jest.fn());
            jest.spyOn(NativeScheduleService, 'refreshCache').mockRejectedValue(new Error('BBC is down'));

            await NativeScheduleService.getFeed();
            await new Promise((resolve) => setImmediate(resolve));

            expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('BBC is down'));
        });

        it('does not start another refresh within the minimum interval of the last attempt', async () => {
            staleFeed();
            NativeScheduleService.lastRefreshAttempt = Date.now() - 60 * 1000;
            const refreshSpy = jest.spyOn(NativeScheduleService, 'refreshCache').mockResolvedValue();

            await NativeScheduleService.getFeed();

            expect(refreshSpy).not.toHaveBeenCalled();
        });

        it('refreshes again once the minimum interval has passed', async () => {
            staleFeed();
            NativeScheduleService.lastRefreshAttempt = Date.now() - 6 * 60 * 1000;
            const refreshSpy = jest.spyOn(NativeScheduleService, 'refreshCache').mockResolvedValue();

            await NativeScheduleService.getFeed();

            expect(refreshSpy).toHaveBeenCalledTimes(1);
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
    describe('schedule page retries', () => {
        const page = '<div class="programme__titles"><a href="/programmes/abc123" aria-label="27 Apr 07:00: Show"></a></div>';
        const httpError = (status: number, headers: Record<string, string> = {}) =>
            Object.assign(new Error(`HTTP ${status}`), { response: { status, headers } });

        beforeEach(() => {
            jest.spyOn(loggingService, 'error').mockImplementation(jest.fn());
        });

        it('retries a 429 and uses the page once it loads', async () => {
            (axios.get as jest.Mock)
                .mockRejectedValueOnce(httpError(429))
                .mockRejectedValueOnce(httpError(429))
                .mockResolvedValueOnce({ data: page });

            const pids = await NativeScheduleService.getPidsFromSchedulePage('https://schedule');

            expect(pids).toEqual(['abc123']);
            expect(axios.get).toHaveBeenCalledTimes(3);
            expect(NativeScheduleService.failedPages).toBe(0);
        });

        it('retries a 5xx and a dropped connection', async () => {
            (axios.get as jest.Mock)
                .mockRejectedValueOnce(httpError(503))
                .mockRejectedValueOnce(Object.assign(new Error('reset'), { code: 'ECONNRESET' }))
                .mockResolvedValueOnce({ data: page });

            expect(await NativeScheduleService.getPidsFromSchedulePage('https://schedule')).toEqual(['abc123']);
        });

        it('honours Retry-After, capped at 30 seconds', async () => {
            jest.useFakeTimers();
            try {
                (axios.get as jest.Mock)
                    .mockRejectedValueOnce(httpError(429, { 'retry-after': '120' }))
                    .mockResolvedValueOnce({ data: page });

                const pending = NativeScheduleService.getPidsFromSchedulePage('https://schedule');
                await jest.advanceTimersByTimeAsync(29_000);
                expect(axios.get).toHaveBeenCalledTimes(1);
                await jest.advanceTimersByTimeAsync(1_500);

                expect(await pending).toEqual(['abc123']);
                expect(axios.get).toHaveBeenCalledTimes(2);
            } finally {
                jest.useRealTimers();
            }
        });

        it('gives up after three attempts and counts the page as failed', async () => {
            (axios.get as jest.Mock).mockRejectedValue(httpError(429));

            const pids = await NativeScheduleService.getPidsFromSchedulePage('https://schedule');

            expect(pids).toEqual([]);
            expect(axios.get).toHaveBeenCalledTimes(3);
            expect(NativeScheduleService.failedPages).toBe(1);
        });

        it('does not retry errors that are not a rate limit, server error or network failure', async () => {
            (axios.get as jest.Mock).mockRejectedValue(httpError(404));

            await NativeScheduleService.getPidsFromSchedulePage('https://schedule');

            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(NativeScheduleService.failedPages).toBe(1);
        });
    });
});
