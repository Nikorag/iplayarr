import axios, { AxiosResponse } from 'axios';
import lunr from 'lunr';
import { IPlayerSearchResult, VideoType } from 'src/types/IPlayerSearchResult';
import { IPlayerNewSearchResponse, IPlayerNewSearchResult } from 'src/types/responses/iplayer/IPlayerNewSearchResponse';
import { IPlayerChildrenResponse } from 'src/types/responses/IPlayerMetadataResponse';

import { emptySearchResult, pageSize } from '../constants/iPlayarrConstants';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerDetails } from '../types/IPlayerDetails';
import { Facet, SearchResponse } from '../types/responses/SearchResponse';
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

interface iPlayerCachedResponse {
    allPids : string[],
    facets : Facet[]
}

export class SearchService {
    searchCache: RedisCacheService<SearchResponse> = new RedisCacheService('search_cache', 300);
    iPlayerResponseCache: RedisCacheService<iPlayerCachedResponse> = new RedisCacheService('ipr_cache', 300);

    async search(inputTerm: string, season?: number, episode?: number, page: number = 1): Promise<SearchResponse> {
        const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);
        const { term, synonym } = await this.#getTerm(inputTerm, season);

        let results: SearchResponse | undefined = await this.searchCache.get(`${term}_${page}`);
        if (!results) {
            const service = (term == '*' || nativeSearchEnabled != 'true') ? iplayerService : this;
            results = await service.performSearch(term, synonym, page);
            this.searchCache.set(`${term}_${page}`, results as SearchResponse);
        } else {
            //Fix the results which are stored as string
            results.results.forEach(result => {
                result.pubDate = result.pubDate ? new Date((result.pubDate as unknown as string)) : undefined;
            });
        }

        if (results) {
            results.results = await this.#filterForSeasonAndEpisode(results.results, season, episode);

            if (nativeSearchEnabled == 'false') {
                const episodeCache: IPlayerSearchResult[] = await episodeCacheService.searchEpisodeCache(inputTerm);
                for (const cachedEpisode of episodeCache) {
                    if (cachedEpisode) {
                        const exists = results.results.some(({ pid }) => pid == cachedEpisode.pid);
                        const validSeason = season ? cachedEpisode.series == season : true;
                        const validEpisode = episode ? cachedEpisode.episode == episode : true;
                        if (!exists && validSeason && validEpisode) {
                            results.results.push({ ...cachedEpisode, pubDate: cachedEpisode.pubDate ? new Date(cachedEpisode.pubDate) : undefined });
                        }
                    }
                }
            }

            results.results = results.results.filter(({ pubDate }) => !pubDate || pubDate < new Date());
            return results;
        }
        return emptySearchResult;
    }

    async performSearch(term: string, synonym?: Synonym, page: number = 1): Promise<SearchResponse> {
        const { sizeFactor } = await getQualityProfile();
        let ipr: iPlayerCachedResponse | undefined = await this.iPlayerResponseCache.get(term);
        if (!ipr) {
            ipr = {
                facets : [],
                allPids : []
            }
            const url = `https://ibl.api.bbc.co.uk/ibl/v1/new-search?q=${encodeURIComponent(term)}`;
            try {
                const response: AxiosResponse<IPlayerNewSearchResponse> = await axios.get(url, {
                    headers: {
                        'Origin': 'https://www.bbc.co.uk'
                    }
                });
                if (response.status == 200) {
                    const { new_search: { results } } = response.data;

                    //Index them each and search again, iPlayer's search is WAY to fuzzy
                    const lunrIndex: lunr.Index = lunr(function (this: lunr.Builder) {
                        this.ref('pid');
                        this.field('pid');
                        this.field('title');

                        results.forEach(({ id: pid, title }) => this.add({ pid, title }))
                    });
                    const lunrResults = lunrIndex.search(term);

                    // Split out any series which are returned into individual results
                    const brandPids: string[] = [];
                    for (const { ref } of lunrResults) {
                        const brandPid = await episodeCacheService.findBrandForPid(ref);
                        if (brandPid) {
                            if (!brandPids.includes(brandPid)) {
                                const { data: { children: seriesList } }: { data: IPlayerChildrenResponse } = await axios.get(`https://www.bbc.co.uk/programmes/${encodeURIComponent(brandPid)}/children.json?limit=100`, {
                                    headers: {
                                        'Origin': 'https://www.bbc.co.uk'
                                    }
                                });
                                const episodes = (await Promise.all(seriesList.programmes.filter(({ type, title }) => type == 'series' && !title.toLocaleLowerCase().includes('special')).map(({ pid }) => episodeCacheService.getSeriesEpisodes(pid)))).flat();

                                ipr.allPids = [...ipr.allPids, ...episodes];
                                brandPids.push(brandPid);
                            }
                        } else {
                            ipr.allPids.push(ref);
                        }
                    }

                    ipr.facets = this.#buildFacets(results);

                    await this.iPlayerResponseCache.set(term, ipr);
                }
            } catch {
                return await iplayerService.performSearch(term, synonym, page);
            }
        }

        const start = (page - 1) * pageSize;
        const pagedPids = ipr.allPids.slice(start, start + pageSize);

        const chunks = splitArrayIntoChunks(pagedPids, 5);
        const infos = await chunks.reduce(async (accPromise, chunk) => {
            const acc = await accPromise; // Ensure previous results are awaited
            const results: IPlayerDetails[] = await iplayerService.details(chunk);
            return [...acc, ...results];
        }, Promise.resolve([]));

        const detailedResults: IPlayerSearchResult[] = await Promise.all(infos.map((info: IPlayerDetails) => this.#createSearchResult(info.title, info, sizeFactor, synonym)));
        return {
            facets : ipr.facets,
            pagination: {
                page,
                totalPages: Math.ceil(ipr.allPids.length / pageSize),
                totalResults: ipr.allPids.length
            },
            results: detailedResults
        }
    }

    #buildFacets(results : IPlayerNewSearchResult[]): Facet[] {
        const facets: Facet[] = [];

        facets.push(this.#buildFacet('Category', (result : IPlayerNewSearchResult) => result.categories, results));
        facets.push(this.#buildFacet('Channel', (result) => result.master_brand?.titles?.large ? [result.master_brand?.titles?.large] : [] , results));
        facets.push(this.#buildFacet('Type', (result) => result.count ? [VideoType.TV.toString()] : [VideoType.MOVIE.toString()], results));

        return facets;
    }

    #buildFacet(title : string, getValuesCallback : (result : IPlayerNewSearchResult) => string[], results : IPlayerNewSearchResult[]) : Facet {
        const facet : Facet = {
            title,
            values : []
        }
        const countMap: Record<string, number> = {};

        results.forEach(result => {
            const values = getValuesCallback(result);
            values.forEach(element => {
                countMap[element] = (countMap[element] || 0) + (result.count ?? 1);
            });
        });

        facet.values = Object.entries(countMap).map(([label, total]) => ({
            label, total
        }));

        return facet;
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
            episodeTitle: details.episodeTitle,
            allCategories: details.allCategories
        }
    }

    removeFromSearchCache(term: string) {
        this.searchCache.del(`${term}_*`);
    }
}

export default new SearchService();