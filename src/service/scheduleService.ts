import cron from 'node-cron';

import downloadFacade from '../facade/downloadFacade';
import { IplayarrParameter } from '../types/IplayarrParameters';
import configService from './configService';
import episodeCacheService from './episodeCacheService';
import getIplayerSearchService from './search/GetIplayerSearchService';


class ScheduleService {
    init(){
        configService.getParameter(IplayarrParameter.REFRESH_SCHEDULE).then((cronSchedule) => {
            cron.schedule(cronSchedule as string, async () => {
                const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);
                if (nativeSearchEnabled == 'false') {
                    getIplayerSearchService.refreshCache();
                    episodeCacheService.recacheAllSeries();
                }
                downloadFacade.cleanupFailedDownloads();
            });
        });
    }
}

export default new ScheduleService();