import axios, { AxiosResponse } from 'axios';
import lunr, { Index } from 'lunr';
import { IPlayerNewSearchResponse, IPlayerNewSearchResult } from 'src/types/responses/iplayer/IPlayerNewSearchResponse';
import { IPlayerChildrenResponse } from 'src/types/responses/IPlayerMetadataResponse';

import { emptySearchResult,maxFacets,pageSize } from '../constants/iPlayarrConstants';
import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../types/IPlayerSearchResult';
import { Facet, SearchFacets, SearchResponse } from '../types/responses/SearchResponse';
import { Synonym } from '../types/Synonym';
import { createNZBName, getQualityProfile, splitArrayIntoChunks } from '../utils/Utils';
import { AbstractSearchService } from './abstractSearchService';
import episodeCacheService from './episodeCacheService';
import facetService from './facetService';
import iplayerService from './iplayerService';
import RedisCacheService from './redisCacheService';


interface NativeResponse {
    pids: string[],
    facets: Facet[]
}

export class SearchService implements AbstractSearchService {
    nativeSearchCache: RedisCacheService<NativeResponse> = new RedisCacheService('native_seach_cache', 300);

    async performSearch(term: string, synonym?: Synonym, page: number = 1, facets: SearchFacets = {}): Promise<SearchResponse> {
        const { sizeFactor } = await getQualityProfile();

        let nativeResponse: NativeResponse | undefined = await this.nativeSearchCache.get(this.getCacheKey(term, facets));

        if (!nativeResponse) {
            // Create a dummy 
            nativeResponse = {
                pids: [],
                facets: []
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

                    //Search again via lunr to remove the guff that iPlayer returns
                    const lunrResults : Index.Result[] = this.#indexAndReSearch(term, results, facets);

                    //Process the pids
                    const pidLedger : string[] = [];
                    for (const {ref} of lunrResults){
                        const brandPid = await episodeCacheService.findBrandForPid(ref); //Check if we're a brand or a member of one.
                        if (brandPid){
                            //Only process this brandPid once.
                            if (!pidLedger.includes(brandPid)){
                                const { data: { children: seriesList } }: { data: IPlayerChildrenResponse } = await axios.get(`https://www.bbc.co.uk/programmes/${encodeURIComponent(brandPid)}/children.json?limit=100`, {
                                    headers: {
                                        'Origin': 'https://www.bbc.co.uk'
                                    }
                                });
                                const episodes = (await Promise.all(seriesList.programmes.filter(({ type, title }) => type == 'series' && !title.toLocaleLowerCase().includes('special')).map(({ pid }) => episodeCacheService.getSeriesEpisodes(pid)))).flat();

                                episodes.forEach((episode) => nativeResponse?.pids.push(episode))
                                pidLedger.push(brandPid);
                            }
                        } else {
                            nativeResponse?.pids.push(ref)
                        }
                    }

                    nativeResponse.facets = this.#buildFacets(results);
                    await this.nativeSearchCache.set(this.getCacheKey(term, facets), nativeResponse);
                }
            } catch {
                // Fallback to get_iplayer in case of any issues
                return await iplayerService.performSearch(term, synonym, page);
            }

            // Split the pids into pages
            const start = (page - 1) * pageSize;
            const pagedPids = nativeResponse.pids.slice(start, start + pageSize);

            // Process the page in chunks
            const chunks = splitArrayIntoChunks(pagedPids, 5);
            const infos = await chunks.reduce(async (accPromise, chunk) => {
                const acc = await accPromise; // Ensure previous results are awaited
                const results: IPlayerDetails[] = await iplayerService.details(chunk);
                return [...acc, ...results];
            }, Promise.resolve([]));

            const detailedResults: IPlayerSearchResult[] = await Promise.all(infos.map((info: IPlayerDetails) => this.#createSearchResult(info.title, info, sizeFactor, synonym)));
            const totalPages = Math.ceil(nativeResponse.pids.length / pageSize);
            const totalResults = nativeResponse.pids.length;
            
            return {
                facets: nativeResponse.facets,
                pagination: {
                    page,
                    totalPages,
                    totalResults
                },
                results: detailedResults
            }
        }
        return emptySearchResult;
    }

    #indexAndReSearch(term : string, results : IPlayerNewSearchResult[], facets: SearchFacets) : Index.Result[] {
        //Index them each and search again, iPlayer's search is WAY to fuzzy
        const lunrIndex: lunr.Index = lunr(function (this: lunr.Builder) {
            this.ref('pid');
            this.field('pid');
            this.field('title');

            //Filter the results
            const facetedResults = facetService.facetResults(results, facets);

            facetedResults.forEach(({ id: pid, title }) => this.add({ pid, title }))
        });
        return lunrIndex.search(term);
    }

    #buildFacets(results: IPlayerNewSearchResult[]): Facet[] {
        const facets: Facet[] = [];

        facets.push(this.#buildFacet('Category', (result: IPlayerNewSearchResult) => result.categories, results));
        facets.push(this.#buildFacet('Channel', (result) => result.master_brand?.titles?.large ? [result.master_brand?.titles?.large] : [], results));
        facets.push(this.#buildFacet('Type', (result) => result.count ? [VideoType.TV.toString()] : [VideoType.MOVIE.toString()], results));

        return facets;
    }

    #buildFacet(title: string, getValuesCallback: (result: IPlayerNewSearchResult) => string[], results: IPlayerNewSearchResult[]): Facet {
        const facet: Facet = { title, values: [] }
        const countMap: Record<string, number> = {};

        results.forEach(result => {
            const values = getValuesCallback(result);
            values.forEach(element => {
                countMap[element] = (countMap[element] || 0) + 1;
            });
        });

        facet.values = Object.entries(countMap).sort((a, b) => b[1] - a[1]).map(([label, total]) => ({
            label, total
        })).slice(0, maxFacets);

        return facet;
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

    getCacheKey(term: string, facets: SearchFacets) {
        return `${term}_${JSON.stringify(facets)}`;
    }
}

export default new SearchService();