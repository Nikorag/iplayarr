import axios, { AxiosResponse } from 'axios';

import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult } from '../types/IPlayerSearchResult';
import { IPlayerNewSearchResponse } from '../types/responses/iplayer/IPlayerNewSearchResponse';
import { IPlayerChildrenResponse } from '../types/responses/IPlayerMetadataResponse';
import { Synonym } from '../types/Synonym';
import { createNZBName, getQualityProfile, removeLastFourDigitNumber, splitArrayIntoChunks } from '../utils/Utils';
import configService from './configService';
import episodeCacheService from './episodeCacheService';
import iplayerService from './iplayerService';
import RedisCacheService from './redisCacheService';
import synonymService from './synonymService';

interface SearchTerm {
    term: string,
    synonym?: Synonym
}

export class SearchService {
    searchCache: RedisCacheService<IPlayerSearchResult[]> = new RedisCacheService('search_cache', 300);

    async search(inputTerm: string, season?: number, episode?: number): Promise<IPlayerSearchResult[]> {
        const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);
        const { term, synonym } = await this.#getTerm(inputTerm, season);

        let results: IPlayerSearchResult[] | undefined = await this.searchCache.get(term);
        if (!results) {
            const service = (term == '*' || nativeSearchEnabled != 'true') ? iplayerService : this;
            results = await service.performSearch(term, synonym);
            this.searchCache.set(term, results as IPlayerSearchResult[]);
        } else {
            //Fix the results which are stored as string
            results.forEach(result => {
                result.pubDate = result.pubDate ? new Date((result.pubDate as unknown as string)) : undefined;
            });
        }

        const filteredResults = await this.#filterForSeasonAndEpisode(results as IPlayerSearchResult[], season, episode);

        if (nativeSearchEnabled == 'false') {
            const episodeCache: IPlayerSearchResult[] = await episodeCacheService.searchEpisodeCache(inputTerm);
            for (const cachedEpisode of episodeCache) {
                if (cachedEpisode) {
                    const exists = filteredResults.some(({ pid }) => pid == cachedEpisode.pid);
                    const validSeason = season ? cachedEpisode.series == season : true;
                    const validEpisode = episode ? cachedEpisode.episode == episode : true;
                    if (!exists && validSeason && validEpisode) {
                        filteredResults.push({ ...cachedEpisode, pubDate: cachedEpisode.pubDate ? new Date(cachedEpisode.pubDate) : undefined });
                    }
                }
            }
        }

        return filteredResults.filter(({ pubDate }) => !pubDate || pubDate < new Date());
    }

    async performSearch(term: string, synonym?: Synonym): Promise<IPlayerSearchResult[]> {
        const { sizeFactor } = await getQualityProfile();
        const url = `https://ibl.api.bbc.co.uk/ibl/v1/new-search?q=${encodeURIComponent(term)}`;
        const response: AxiosResponse<IPlayerNewSearchResponse> = await axios.get(url);
        if (response.status == 200) {
            const { new_search: { results } } = response.data;
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
                const { data: { children: seriesList } }: { data: IPlayerChildrenResponse } = await axios.get(`https://www.bbc.co.uk/programmes/${encodeURIComponent(brandPid)}/children.json?limit=100`);
                const episodes = (await Promise.all(seriesList.programmes.filter(({ type }) => type == 'series').map(({ pid }) => episodeCacheService.getSeriesEpisodes(pid)))).flat();
                episodes.push(...seriesList.programmes.filter(({ type, first_broadcast_date }) => type == 'episode' && first_broadcast_date != null).map(({ pid }) => pid));

                const chunks = splitArrayIntoChunks(episodes, 5);
                const chunkInfos = await chunks.reduce(async (accPromise, chunk) => {
                    const acc = await accPromise; // Ensure previous results are awaited
                    const results: IPlayerDetails[] = await iplayerService.details(chunk);
                    return [...acc, ...results];
                }, Promise.resolve([])); // Initialize accumulator as a resolved Promise

                infos = [...infos, ...chunkInfos];
            }

            return await Promise.all(infos.map((info: IPlayerDetails) => this.#createSearchResult(info.title, info, sizeFactor, synonym)));

        } else {
            return [];
        }
    }

    async #getTerm(inputTerm: string, season?: number): Promise<SearchTerm> {
        const term = !season ? removeLastFourDigitNumber(inputTerm) : inputTerm;
        const synonym = await synonymService.getSynonym(inputTerm);
        return {
            term: synonym ? synonym.target : term,
            synonym
        }
    }

    async #filterForSeasonAndEpisode(results: IPlayerSearchResult[], season?: number, episode?: number) {
        return results.filter((result) => {
            return ((!season || result.series == season) && (!episode || result.episode == episode))
        })
    }

    async #createSearchResult(term: string, details: IPlayerDetails, sizeFactor: number, synonym?: Synonym): Promise<IPlayerSearchResult> {
        return {
            number: 0,
            title: details.title,
            channel: details.channel || '',
            pid: details.pid,
            request: {
                term,
                line: term
            },
            episode: details.episode,
            pubDate: details.firstBroadcast ? new Date(details.firstBroadcast) : undefined,
            series: details.series,
            type: details.type,
            size: details.runtime ? (details.runtime * 60) * sizeFactor : undefined,
            nzbName: await createNZBName(details, synonym),
            episodeTitle: details.episodeTitle
        }
    }

    removeFromSearchCache(term: string) {
        this.searchCache.del(term);
    }
}

export default new SearchService();