import { spawn } from 'child_process';

import downloadFacade from '../../facade/downloadFacade';
import { IPlayerSearchResult } from '../../types/IPlayerSearchResult';
import getIplayerExecutableService from '../getIplayerExecutableService';
import loggingService from '../loggingService';
import GetIplayerSearchService from '../search/GetIplayerSearchService';
import { AbstractScheduleService } from './AbstractScheduleService';

class GetIplayerScheduleService implements AbstractScheduleService {
    async refreshCache(): Promise<void> {
        const { exec, args } = await getIplayerExecutableService.getIPlayerExec();

        //Refresh the cache
        loggingService.debug(`Executing get_iplayer with args: ${[...args].join(' ')} --cache-rebuild`);
        const refreshService = spawn(exec as string, [...args, '--cache-rebuild'], { shell: true });

        refreshService.stdout.on('data', (data) => {
            loggingService.debug(data.toString());
        });

        refreshService.stderr.on('data', (data) => {
            loggingService.error(data.toString());
        });

        //Delete failed jobs
        downloadFacade.cleanupFailedDownloads();
    }

    async getFeed(): Promise<IPlayerSearchResult[]> {
        return await GetIplayerSearchService.search('*');
    }
}

export default new GetIplayerScheduleService();