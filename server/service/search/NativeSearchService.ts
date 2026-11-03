import axios, { AxiosResponse } from 'axios';
import { Index } from 'lunr';
import lunr from 'lunr';

import { searchResultLimit } from '../../constants/iPlayarrConstants';
import { IPlayerDetails } from '../../types/IPlayerDetails';
import { IPlayerSearchResult } from '../../types/IPlayerSearchResult';
import {
    IPlayerNewSearchResponse,
    IPlayerNewSearchResult,
} from '../../types/responses/iplayer/IPlayerNewSearchResponse';
import { IPlayerEpisodeMetadata } from '../../types/responses/IPlayerMetadataResponse';
import { Synonym } from '../../types/Synonym';
import { createNZBName, getQualityProfile, splitArrayIntoChunks } from '../../utils/Utils';
import iplayerDetailsService from '../iplayerDetailsService';
import loggingService from '../loggingService';
import metricsService from '../metricsService';
import AbstractSearchService from './AbstractSearchService';

class NativeSearchService implements AbstractSearchService {
    async search(term: string, synonym?: Synonym): Promise<IPlayerSearchResult[]> {
        const { sizeFactor } = await getQualityProfile();
        const url = `https://ibl.api.bbc.co.uk/ibl/v1/new-search?q=${encodeURIComponent(term)}`;
        let response: AxiosResponse<IPlayerNewSearchResponse>;
        try {
            response = await axios.get(url, { timeout: 10000 });
        } catch (err) {
            // axios rejects (doesn't resolve with a non-200 status) on 4xx/5xx by default.
            // A single bad query — an odd synonym, an unexpected character — must not take
            // down the whole process; every other in-flight search on this instance would
            // die with it, and the Newznab endpoint would drop its response mid-stream from
            // Sonarr/Radarr's point of view. Log and degrade to zero results instead.
            loggingService.error(`NativeSearchService: BBC search failed for term '${term}': ${err}`);
            metricsService.recordUpstreamError('bbc_search');
            return [];
        }
        if (response.status == 200) {
            const {
                new_search: { results },
            } = response.data;

            const lunrResults: Index.Result[] = this.#indexAndReSearch(term, results);
            const pidLedger: string[] = [];

            let infos: IPlayerDetails[] = [];

            for (const { ref } of lunrResults) {
                const brandPid = await iplayerDetailsService.findBrandForPid(ref);
                if (brandPid) {
                    if (!pidLedger.includes(ref)) {
                        const seriesList: IPlayerEpisodeMetadata[] =
                            await iplayerDetailsService.getSeriesEpisodes(brandPid);

                        // Add all the series episodes to list
                        const episodes = (
                            await Promise.all(
                                seriesList
                                    .filter(({ type }) => type == 'series')
                                    .map(({ id }) => iplayerDetailsService.getSeriesEpisodes(id))
                            )
                        ).flat();
                        episodes.push(
                            ...seriesList.filter(
                                ({ type, release_date_time }) => type == 'episode' && release_date_time != null
                            )
                        );

                        const chunks = splitArrayIntoChunks(episodes, 5);

                        const chunkInfos: IPlayerDetails[] = [];
                        for (const chunk of chunks) {
                            const results: IPlayerDetails[] =
                                await iplayerDetailsService.detailsForEpisodeMetadata(chunk);
                            chunkInfos.push(...results);
                        }

                        infos = [...infos, ...chunkInfos];
                        pidLedger.push(ref);
                    }
                } else {
                    const pidInfos = await iplayerDetailsService.details([ref]);
                    pidInfos.forEach((info) => infos.push(info));
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

    async processCompletedSearch(
        results: IPlayerSearchResult[],
        _inputTerm: string,
        synonym?: Synonym
    ): Promise<IPlayerSearchResult[]> {
        const exemptions = synonym?.exemptions
            ?.split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
        return exemptions?.length
            ? results.filter((r) => exemptions.every((ex) => !r.title.toLowerCase().includes(ex)))
            : results;
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

            results.forEach(({ id: pid, title }) => this.add({ pid, title }));
        });
        try {
            return lunrIndex.search(term);
        } catch {
            const cleanTerm = term.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
            if (!cleanTerm) {
                return [];
            }
            try {
                return lunrIndex.search(cleanTerm);
            } catch {
                return [];
            }
        }
    }
}

export default new NativeSearchService();
