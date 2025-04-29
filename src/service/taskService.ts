import cron from 'node-cron';

import downloadFacade from '../facade/downloadFacade';
import scheduleFacade from '../facade/scheduleFacade';
import { IplayarrParameter } from '../types/IplayarrParameters';
import configService from './configService';
import episodeCacheService from './episodeCacheService';


class TaskService {
    init(){
        configService.getParameter(IplayarrParameter.REFRESH_SCHEDULE).then((cronSchedule) => {
            cron.schedule(cronSchedule as string, async () => {
                const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);
                if (nativeSearchEnabled == 'false') {
                    scheduleFacade.refreshCache();
                    episodeCacheService.recacheAllSeries();
                }
                downloadFacade.cleanupFailedDownloads();
            });
        });
    }
}

export default new TaskService();