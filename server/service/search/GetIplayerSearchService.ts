import { spawn } from 'child_process';

import { IPlayerSearchResult } from '../../types/IPlayerSearchResult';
import { Synonym } from '../../types/Synonym';
import { getQualityProfile } from '../../utils/Utils';
import episodeCacheService from '../episodeCacheService';
import getIplayerExecutableService from '../getIplayerExecutableService';
import loggingService from '../loggingService';
import AbstractSearchService from './AbstractSearchService';

class GetIplayerSearchService implements AbstractSearchService {
    async search(term: string, synonym?: Synonym): Promise<IPlayerSearchResult[]> {
        const { sizeFactor } = await getQualityProfile();
        return new Promise(async (resolve, reject) => {
            const awaitingPromises: Promise<void>[] = [];
            const results: IPlayerSearchResult[] = [];
            const { exec, args } = await getIplayerExecutableService.getSearchParameters(term, synonym);

            loggingService.debug(`Executing get_iplayer with args: ${args.join(' ')}`);
            const searchProcess = spawn(exec as string, args, { shell: true });

            searchProcess.stdout.on('data', (data) => {
                loggingService.debug(data.toString().trim());
                awaitingPromises.push(getIplayerExecutableService.parseResults(
                    term,
                    data,
                    sizeFactor
                ).then((chunkResults: IPlayerSearchResult[]) => {
                    chunkResults.forEach((chunk) => results.push(chunk));
                }));
            });

            searchProcess.stderr.on('data', (data) => {
                loggingService.error(data.toString().trim());
            });

            searchProcess.on('close', async (code) => {
                if (code === 0) {
                    await Promise.all(awaitingPromises);
                    resolve(await getIplayerExecutableService.processCompletedSearch(results, synonym));
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    }

    async processCompletedSearch(results: IPlayerSearchResult[], inputTerm: string, _synonym?: Synonym, season?: number, episode?: number): Promise<IPlayerSearchResult[]> {
        const episodeCache: IPlayerSearchResult[] = await episodeCacheService.searchEpisodeCache(inputTerm);
        for (const cachedEpisode of episodeCache) {
            if (cachedEpisode) {
                const exists = results.some(({ pid }) => pid == cachedEpisode.pid);
                const validSeason = season ? cachedEpisode.series == season : true;
                const validEpisode = episode ? cachedEpisode.episode == episode : true;
                if (!exists && validSeason && validEpisode) {
                    results.push({
                        ...cachedEpisode,
                        pubDate: cachedEpisode.pubDate ? new Date(cachedEpisode.pubDate) : undefined,
                    });
                }
            }
        }
        return results;
    }
}

export default new GetIplayerSearchService();