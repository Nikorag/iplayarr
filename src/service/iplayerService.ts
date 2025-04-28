import { spawn } from 'child_process';

import downloadFacade from '../facade/downloadFacade';
import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult } from '../types/IPlayerSearchResult';
import { Synonym } from '../types/Synonym';
import { calculateSeasonAndEpisode, getQualityProfile } from '../utils/Utils';
import episodeCacheService from './episodeCacheService';
import getIplayerExecutableService from './getIplayerExecutableService';
import loggingService from './loggingService';

const iplayerService = {
    refreshCache: async () => {
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
    },

    details: async (pids: string[]): Promise<IPlayerDetails[]> => {
        return await Promise.all(pids.map((pid) => iplayerService.episodeDetails(pid)));
    },

    episodeDetails: async (pid: string): Promise<IPlayerDetails> => {
        const { programme } = await episodeCacheService.getMetadata(pid);
        const [type, episode, episodeTitle, series] = calculateSeasonAndEpisode(programme);
        return {
            pid,
            title: programme.display_title?.title ?? programme.title,
            episode,
            episodeTitle,
            series,
            channel: programme.ownership?.service?.title,
            category: programme.categories?.length ? programme.categories[0].title : '',
            description: programme.medium_synopsis,
            runtime: programme.versions?.length ? programme.versions[0].duration / 60 : 0,
            firstBroadcast: programme.first_broadcast_date ?? undefined,
            link: `https://www.bbc.co.uk/programmes/${pid}`,
            thumbnail: programme.image
                ? `https://ichef.bbci.co.uk/images/ic/1920x1080/${programme.image.pid}.jpg`
                : undefined,
            type,
        };
    },

    performSearch: async (term: string, synonym?: Synonym): Promise<IPlayerSearchResult[]> => {
        const { sizeFactor } = await getQualityProfile();
        return new Promise(async (resolve, reject) => {
            const results: IPlayerSearchResult[] = [];
            const { exec, args } = await getIplayerExecutableService.getSearchParameters(term, synonym);

            loggingService.debug(`Executing get_iplayer with args: ${args.join(' ')}`);
            const searchProcess = spawn(exec as string, args, { shell: true });

            searchProcess.stdout.on('data', (data) => {
                loggingService.debug(data.toString().trim());
                const chunkResults: IPlayerSearchResult[] = getIplayerExecutableService.parseResults(
                    term,
                    data,
                    sizeFactor
                );
                chunkResults.forEach((chunk) => results.push(chunk));
            });

            searchProcess.stderr.on('data', (data) => {
                loggingService.error(data.toString().trim());
            });

            searchProcess.on('close', async (code) => {
                if (code === 0) {
                    resolve(await getIplayerExecutableService.processCompletedSearch(results, synonym));
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    },
};

export default iplayerService;
