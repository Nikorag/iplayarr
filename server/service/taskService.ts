import cron from 'node-cron';

import downloadFacade from '../facade/downloadFacade';
import scheduleFacade from '../facade/scheduleFacade';
import { IplayarrParameter } from '../types/IplayarrParameters';
import configService from './configService';
import episodeCacheService from './episodeCacheService';
import loggingService from './loggingService';


class TaskService {
    init(){
        configService.getParameter(IplayarrParameter.REFRESH_SCHEDULE).then((cronSchedule) => {
            cron.schedule(cronSchedule as string, async () => {
                const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);
                // Nothing awaits these, so a rejection would otherwise be unhandled and crash the process
                scheduleFacade
                    .refreshCache()
                    .then(() => {
                        if (nativeSearchEnabled == 'false') {
                            return episodeCacheService.recacheAllSeries();
                        }
                    })
                    .catch((error) => loggingService.error(`Scheduled refresh failed: ${error?.message ?? error}`));
                Promise.resolve(downloadFacade.cleanupFailedDownloads()).catch((error) =>
                    loggingService.error(`Cleaning up failed downloads failed: ${error?.message ?? error}`)
                );
            });
        });
    }
}

export default new TaskService();