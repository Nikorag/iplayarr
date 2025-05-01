import cron from 'node-cron';

import downloadFacade from '../../src/facade/downloadFacade';
import scheduleFacade from '../../src/facade/scheduleFacade';
import configService from '../../src/service/configService';
import episodeCacheService from '../../src/service/episodeCacheService';
import TaskService from '../../src/service/taskService';

// Mock dependencies
jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}));

jest.mock('../../src/service/configService', () => ({
    getParameter: jest.fn(),
}));

jest.mock('../../src/facade/scheduleFacade', () => ({
    refreshCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/facade/downloadFacade', () => ({
    cleanupFailedDownloads: jest.fn(),
}));

jest.mock('../../src/service/episodeCacheService', () => ({
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
