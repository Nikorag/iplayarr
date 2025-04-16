import axios, { AxiosResponse } from 'axios';

import { emptySearchResult, pageSize } from '../constants/iPlayarrConstants';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../types/IPlayerSearchResult';
import { IPlayerNewSearchResponse } from '../types/responses/iplayer/IPlayerNewSearchResponse';
import { IPlayerChilrenResponse } from '../types/responses/IPlayerMetadataResponse';
import { SearchResponse } from '../types/responses/SearchResponse';
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
    searchCache: RedisCacheService<SearchResponse> = new RedisCacheService('search_cache', 300);

    async search(inputTerm: string, season?: number, episode?: number, page : number = 1): Promise<SearchResponse> {
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
                result.pubDate = new Date((result.pubDate as unknown as string));
            });
        }

        if (results){
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

    async performSearch(term: string, synonym?: Synonym, page : number = 1): Promise<SearchResponse> {
        const { sizeFactor } = await getQualityProfile();
        const url = `https://ibl.api.bbc.co.uk/ibl/v1/new-search?q=${encodeURIComponent(term)}`;
        const response: AxiosResponse<IPlayerNewSearchResponse> = await axios.get(url, {headers : {
            'Origin' : 'https://www.bbc.co.uk'
        }});
        if (response.status == 200) {
            const { new_search: { results } } = response.data;
            const brandPids: Set<string> = new Set();

            let allPids = [];
            for (const {id} of results){
                const brandPid = await episodeCacheService.findBrandForPid(id);
                if (brandPid) {
                    brandPids.add(brandPid);
                } else {
                    allPids.push(id);
                }
            }

            for (const brandPid of brandPids) {
                const { data: { children: seriesList } }: { data: IPlayerChilrenResponse } = await axios.get(`https://www.bbc.co.uk/programmes/${encodeURIComponent(brandPid)}/children.json?limit=100`, {headers : {
                    'Origin' : 'https://www.bbc.co.uk'
                }});
                const episodes = (await Promise.all(seriesList.programmes.filter(({ type, title }) => type == 'series' && !title.toLocaleLowerCase().includes('special')).map(({ pid }) => episodeCacheService.getSeriesEpisodes(pid)))).flat();

                allPids = [...allPids, ...episodes];
            }

            const start = (page - 1) * pageSize;
            const pagedPids = allPids.slice(start, start + pageSize);

            const chunks = splitArrayIntoChunks(pagedPids, 5);
            const infos = await chunks.reduce(async (accPromise, chunk) => {
                const acc = await accPromise; // Ensure previous results are awaited
                const results: IPlayerDetails[] = await iplayerService.details(chunk);
                return [...acc, ...results];
            }, Promise.resolve([]));

            const synonymName = synonym ? (synonym.filenameOverride || synonym.from).replaceAll(/[^a-zA-Z0-9\s.]/g, '').replaceAll(' ', '.') : undefined;
            const detailedResults : IPlayerSearchResult[] = await Promise.all(infos.map((info: IPlayerDetails) => this.#createSearchResult(info.title, info, sizeFactor, synonymName)));
            return {
                pagination : {
                    page,
                    totalPages : Math.ceil(allPids.length / pageSize),
                    totalResults : allPids.length
                },
                results : detailedResults
            }
        } else {
            return emptySearchResult;
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

    async #createSearchResult(term: string, details: IPlayerDetails, sizeFactor: number, synonymName: string | undefined): Promise<IPlayerSearchResult> {
        const size: number | undefined = details.runtime ? (details.runtime * 60) * sizeFactor : undefined;

        const type: VideoType = details.episode && details.series ? VideoType.TV : VideoType.MOVIE;
        const nzbName = await createNZBName(type, {
            title: details.title.replaceAll(' ', '.'),
            season: details.series ? details.series.toString().padStart(2, '0') : undefined,
            episode: details.episode ? details.episode.toString().padStart(2, '0') : undefined,
            synonym: synonymName
        });

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
            type,
            size,
            nzbName,
            allCategories : details.allCategories
        }
    }

    removeFromSearchCache(term: string) {
        this.searchCache.del(`${term}_*`);
    }
}

export default new SearchService();