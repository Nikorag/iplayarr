import axios, { AxiosResponse } from 'axios';
import { Index } from 'lunr';
import lunr from 'lunr';

import { searchResultLimit } from '../../constants/iPlayarrConstants';
import { IPlayerDetails } from '../../types/IPlayerDetails';
import { IPlayerSearchResult } from '../../types/IPlayerSearchResult';
import { IPlayerNewSearchResponse, IPlayerNewSearchResult } from '../../types/responses/iplayer/IPlayerNewSearchResponse';
import { IPlayerEpisodesResponse } from '../../types/responses/IPlayerMetadataResponse';
import { Synonym } from '../../types/Synonym';
import { createNZBName, getQualityProfile, splitArrayIntoChunks } from '../../utils/Utils';
import episodeCacheService from '../episodeCacheService';
import iplayerDetailsService from '../iplayerDetailsService';
import AbstractSearchService from './AbstractSearchService';

class NativeSearchService implements AbstractSearchService {

    async search(term: string, synonym?: Synonym): Promise<IPlayerSearchResult[]> {
        const { sizeFactor } = await getQualityProfile();
        const url = `https://ibl.api.bbc.co.uk/ibl/v1/new-search?q=${encodeURIComponent(term)}`;
        const response: AxiosResponse<IPlayerNewSearchResponse> = await axios.get(url);
        if (response.status == 200) {
            const {
                new_search: { results },
            } = response.data;

            const lunrResults: Index.Result[] = this.#indexAndReSearch(term, results);
            const pidLedger: string[] = [];

            let infos: IPlayerDetails[] = [];

            for (const { ref } of lunrResults) {
                const brandPid = await episodeCacheService.findBrandForPid(ref);
                if (brandPid) {
                    if (!pidLedger.includes(ref)) {
                        const { data: { programme_episodes: { elements: seriesList } } }: AxiosResponse<IPlayerEpisodesResponse> = await axios.get(`https://ibl.api.bbci.co.uk/ibl/v1/programmes/${encodeURIComponent(brandPid)}/episodes?per_page=${searchResultLimit}`);
                        const episodes = (await Promise.all(seriesList.filter(({ type }) => type == 'series').map(({ id }) => episodeCacheService.getSeriesEpisodes(id)))).flat();
                        episodes.push(...seriesList.filter(({ type, release_date_time }) => type == 'episode' && release_date_time != null).map(({ id }) => id));

                        const chunks = splitArrayIntoChunks(episodes, 5);
                        const chunkInfos = await chunks.reduce(async (accPromise, chunk) => {
                            const acc = await accPromise; // Ensure previous results are awaited
                            const results: IPlayerDetails[] = await iplayerDetailsService.details(chunk);
                            return [...acc, ...results];
                        }, Promise.resolve([])); // Initialize accumulator as a resolved Promise

                        infos = [...infos, ...chunkInfos];
                        pidLedger.push(ref);
                    }
                } else {
                    const pidInfos = await iplayerDetailsService.details([ref]);
                    pidInfos.forEach(info => infos.push(info));
                }

                //Limit to only 150 results
                if (infos.length >= searchResultLimit) {
                    break;
                }
            }

            return await Promise.all(
                infos.map((info: IPlayerDetails) => this.createSearchResult(info.title, info, sizeFactor, synonym))
            );
        } else {
            return [];
        }
    }

    async processCompletedSearch(results: IPlayerSearchResult[]): Promise<IPlayerSearchResult[]> {
        return results;
    }

    async createSearchResult(
        term: string,
        details: IPlayerDetails,
        sizeFactor: number,
        synonym?: Synonym
    ): Promise<IPlayerSearchResult> {
        return {
            number: 0,
            title: details.title,
            channel: details.channel || '',
            pid: details.pid,
            request: {
                term,
                line: term,
            },
            episode: details.episode,
            pubDate: details.firstBroadcast ? new Date(details.firstBroadcast) : undefined,
            series: details.series,
            type: details.type,
            size: details.runtime ? Math.floor(details.runtime * 60 * sizeFactor) : undefined,
            nzbName: await createNZBName(details, synonym),
            episodeTitle: details.episodeTitle,
        };
    }

    #indexAndReSearch(term: string, results: IPlayerNewSearchResult[]): Index.Result[] {
        //Index them each and search again, iPlayer's search is WAY to fuzzy
        const lunrIndex: lunr.Index = lunr(function (this: lunr.Builder) {
            this.ref('pid');
            this.field('pid');
            this.field('title');

            results.forEach(({ id: pid, title }) => this.add({ pid, title }))
        });
        return lunrIndex.search(term);
    }
}

export default new NativeSearchService();