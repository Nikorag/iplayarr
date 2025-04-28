import axios, { AxiosResponse } from 'axios';

import { IPlayerDetails } from '../../types/IPlayerDetails';
import { IPlayerSearchResult } from '../../types/IPlayerSearchResult';
import { IPlayerNewSearchResponse } from '../../types/responses/iplayer/IPlayerNewSearchResponse';
import { IPlayerChildrenResponse } from '../../types/responses/IPlayerMetadataResponse';
import { Synonym } from '../../types/Synonym';
import { createNZBName, getQualityProfile, splitArrayIntoChunks } from '../../utils/Utils';
import episodeCacheService from '../episodeCacheService';
import iplayerService from '../iplayerService';
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
            const brandPids: Set<string> = new Set();
            let infos: IPlayerDetails[] = [];

            //Only get the first brand from iplayer
            if (results.length > 0) {
                const { id } = results[0];
                const brandPid = await episodeCacheService.findBrandForPid(id);
                if (brandPid) {
                    brandPids.add(brandPid);
                } else {
                    const pidInfos = await iplayerService.details([id]);
                    infos = [...infos, ...pidInfos];
                }
            }

            for (const brandPid of brandPids) {
                const {
                    data: { children: seriesList },
                }: { data: IPlayerChildrenResponse } = await axios.get(
                    `https://www.bbc.co.uk/programmes/${encodeURIComponent(brandPid)}/children.json?limit=100`
                );
                const episodes = (
                    await Promise.all(
                        seriesList.programmes
                            .filter(({ type }) => type == 'series')
                            .map(({ pid }) => episodeCacheService.getSeriesEpisodes(pid))
                    )
                ).flat();
                episodes.push(
                    ...seriesList.programmes
                        .filter(({ type, first_broadcast_date }) => type == 'episode' && first_broadcast_date != null)
                        .map(({ pid }) => pid)
                );

                const chunks = splitArrayIntoChunks(episodes, 5);
                const chunkInfos = await chunks.reduce(async (accPromise, chunk) => {
                    const acc = await accPromise; // Ensure previous results are awaited
                    const results: IPlayerDetails[] = await iplayerService.details(chunk);
                    return [...acc, ...results];
                }, Promise.resolve([])); // Initialize accumulator as a resolved Promise

                infos = [...infos, ...chunkInfos];
            }

            return await Promise.all(
                infos.map((info: IPlayerDetails) => this.#createSearchResult(info.title, info, sizeFactor, synonym))
            );
        } else {
            return [];
        }
    }

    async processCompletedSearch(results: IPlayerSearchResult[]): Promise<IPlayerSearchResult[]> {
        return results;
    }

    async #createSearchResult(
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
}

export default new NativeSearchService();