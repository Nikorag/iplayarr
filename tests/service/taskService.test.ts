import cron from 'node-cron';

import downloadFacade from '../../server/facade/downloadFacade';
import scheduleFacade from '../../server/facade/scheduleFacade';
import configService from '../../server/service/configService';
import episodeCacheService from '../../server/service/episodeCacheService';
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
});
