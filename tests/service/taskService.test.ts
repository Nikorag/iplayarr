import cron from 'node-cron';

import downloadFacade from '../../server/facade/downloadFacade';
import scheduleFacade from '../../server/facade/scheduleFacade';
import configService from '../../server/service/configService';
import episodeCacheService from '../../server/service/episodeCacheService';
import loggingService from '../../server/service/loggingService';
import TaskService from '../../server/service/taskService';

// Mock dependencies
jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}));

jest.mock('../../server/service/configService', () => ({
    getParameter: jest.fn(),
}));

jest.mock('../../server/facade/scheduleFacade', () => ({
    refreshCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../server/facade/downloadFacade', () => ({
    cleanupFailedDownloads: jest.fn(),
}));

jest.mock('../../server/service/episodeCacheService', () => ({
    recacheAllSeries: jest.fn(),
}));

jest.mock('../../server/service/loggingService', () => ({
    error: jest.fn(),
}));

describe('TaskService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should schedule a cron job with the configured schedule', async () => {
        // Mock config values
        (configService.getParameter as jest.Mock)
            .mockResolvedValueOnce('*/5 * * * *') // REFRESH_SCHEDULE
            .mockResolvedValueOnce('false'); // NATIVE_SEARCH

        const cronCallback = jest.fn();
        (cron.schedule as jest.Mock).mockImplementation((expression, callback) => {
            cronCallback.mockImplementation(callback); // Save the callback for later execution
            return {};
        });

        // Run init
        await TaskService.init();

        // Check cron.schedule was called with correct expression
        expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));

        // Execute scheduled job manually
        await cronCallback();

        expect(scheduleFacade.refreshCache).toHaveBeenCalled();
        expect(downloadFacade.cleanupFailedDownloads).toHaveBeenCalled();
        expect(episodeCacheService.recacheAllSeries).toHaveBeenCalled();
    });

    it('should skip recaching if native search is enabled', async () => {
        (configService.getParameter as jest.Mock)
            .mockResolvedValueOnce('*/5 * * * *') // REFRESH_SCHEDULE
            .mockResolvedValueOnce('true'); // NATIVE_SEARCH

        const cronCallback = jest.fn();
        (cron.schedule as jest.Mock).mockImplementation((expression, callback) => {
            cronCallback.mockImplementation(callback);
            return {};
        });

        await TaskService.init();
        await cronCallback();

        expect(scheduleFacade.refreshCache).toHaveBeenCalled();
        expect(downloadFacade.cleanupFailedDownloads).toHaveBeenCalled();
        expect(episodeCacheService.recacheAllSeries).not.toHaveBeenCalled();
    });

    describe('when a scheduled job fails', () => {
        const runCron = async () => {
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('*/5 * * * *') // REFRESH_SCHEDULE
                .mockResolvedValueOnce('false'); // NATIVE_SEARCH
            let job: () => Promise<void> = async () => undefined;
            (cron.schedule as jest.Mock).mockImplementation((_expression, callback) => {
                job = callback;
                return {};
            });
            await TaskService.init();
            await job();
            // let the un-awaited promise chains settle
            await new Promise((resolve) => setImmediate(resolve));
        };

        it('logs a failed schedule refresh instead of leaving an unhandled rejection', async () => {
            (scheduleFacade.refreshCache as jest.Mock).mockRejectedValueOnce(new Error('BBC is down'));

            await runCron();

            expect(loggingService.error).toHaveBeenCalledWith(expect.stringContaining('BBC is down'));
            // the rest of the job still ran
            expect(downloadFacade.cleanupFailedDownloads).toHaveBeenCalled();
        });

        it('logs a failed recache and a failed cleanup', async () => {
            (episodeCacheService.recacheAllSeries as jest.Mock).mockRejectedValueOnce(new Error('recache broke'));
            (downloadFacade.cleanupFailedDownloads as jest.Mock).mockRejectedValueOnce(new Error('cleanup broke'));

            await runCron();

            expect(loggingService.error).toHaveBeenCalledWith(expect.stringContaining('recache broke'));
            expect(loggingService.error).toHaveBeenCalledWith(expect.stringContaining('cleanup broke'));
        });
    });
});
