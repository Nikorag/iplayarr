import { emptySearchResult } from 'src/constants/iPlayarrConstants';
import { AbstractSearchService } from 'src/service/abstractSearchService';
import configService from 'src/service/configService';
import episodeCacheService from 'src/service/episodeCacheService';
import facetService from 'src/service/facetService';
import iplayerService from 'src/service/iplayerService';
import nativeSearchService from 'src/service/nativeSearchService';
import RedisCacheService from 'src/service/redisCacheService';
import synonymService from 'src/service/synonymService';
import { FacetName } from 'src/types/enums/FacetName';
import { IplayarrParameter } from 'src/types/enums/IplayarrParameters';
import { IPlayerSearchResult } from 'src/types/IPlayerSearchResult';
import { SearchFacets, SearchResponse } from 'src/types/responses/SearchResponse';
import { Synonym } from 'src/types/Synonym';
import { removeLastFourDigitNumber } from 'src/utils/Utils';

interface SearchTerm {
    term: string,
    synonym?: Synonym
}

class SearchFacade {
    searchCache: RedisCacheService<SearchResponse> = new RedisCacheService('search_cache', 300);

    async search(query: string, page: number = 1, facets: SearchFacets = {}): Promise<SearchResponse> {
        const [series, episode] = this.#getSeriesAndEpisodeNumbers(facets);
        const { term, synonym } = await this.#getTerm(query, series);

        //Check in the cache
        let results: SearchResponse | undefined = await this.#getResultsFromCache(term, page, facets);

        //It wasn't in the cache
        if (!results) {
            const service: AbstractSearchService = await this.getSearchService(term);
            results = await service.performSearch(term, synonym, page, facets);
            this.searchCache.set(this.createCacheKey(term, page, facets), results as SearchResponse);
        }

        // This if is just a formality, we know results isn't undefined, but because it was declared as a possibility
        if (results) {
            results = await this.#addOffScheduleResults(query, results, facets); // Add Off Schedule Results
            results.results = this.#filterForSeriesAndEpisode(results.results, series, episode); // Filter out the episodes we don't want (The rest of the facets are handled by the services)
            results.results = results.results.filter(({ pubDate }) => !pubDate || pubDate < new Date()); // Filter out the episodes which haven't aired yet
            return results;
        }

        return emptySearchResult;
    }

    #getSeriesAndEpisodeNumbers(facets: SearchFacets): [number | undefined, number | undefined] {
        const [strSeries, strEpisode] = [facetService.getSingularFacet(facets, FacetName.Series), facetService.getSingularFacet(facets, FacetName.Episode)];
        return [strSeries ? parseInt(strSeries) : undefined, strEpisode ? parseInt(strEpisode) : undefined];
    }

    async #getTerm(inputTerm: string, series?: number): Promise<SearchTerm> {
        // Only remove the last four digit number if we don't have a series
        const term = !series ? removeLastFourDigitNumber(inputTerm) : inputTerm;
        const synonym = await synonymService.getSynonym(inputTerm);
        return {
            term: synonym ? synonym.target : term,
            synonym
        }
    }

    async #getResultsFromCache(term: string, page: number, facets: SearchFacets): Promise<SearchResponse | undefined> {
        const results: SearchResponse | undefined = await this.searchCache.get(this.createCacheKey(term, page, facets));
        if (results) {
            //JSON doesn't represent Date's properly so we need to convert them back.
            results.results.forEach(result => {
                result.pubDate = result.pubDate ? new Date((result.pubDate as unknown as string)) : undefined;
            });
        }
        return results;
    }

    createCacheKey(term: string, page: number, facets: SearchFacets) {
        return `${term}_${page}_${JSON.stringify(facets)}`;
    }

    async isNativeSearchEnabled(): Promise<boolean> {
        const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);
        return nativeSearchEnabled == 'true';
    }

    async getSearchService(term: string): Promise<AbstractSearchService> {
        const nativeSearchEnabled = await this.isNativeSearchEnabled();
        return (term == '*' || !nativeSearchEnabled) ? iplayerService : nativeSearchService;
    }

    #filterForSeriesAndEpisode(results: IPlayerSearchResult[], season?: number, episode?: number): IPlayerSearchResult[] {
        return results.filter((result) => {
            return ((!season || result.series == season) && (!episode || result.episode == episode))
        })
    }

    async #addOffScheduleResults(query : string, results : SearchResponse, facets: SearchFacets) : Promise<SearchResponse> {
        const nativeSearchEnabled = await this.isNativeSearchEnabled();
        const [series, episode] = this.#getSeriesAndEpisodeNumbers(facets);

        if (!nativeSearchEnabled) {
            const episodeCache: IPlayerSearchResult[] = await episodeCacheService.searchEpisodeCache(query);
            for (const cachedEpisode of episodeCache) {
                if (cachedEpisode) {
                    const exists = results.results.some(({ pid }) => pid == cachedEpisode.pid);
                    const validSeason = series ? cachedEpisode.series == series : true;
                    const validEpisode = episode ? cachedEpisode.episode == episode : true;
                    if (!exists && validSeason && validEpisode) {
                        results.results.push({ ...cachedEpisode, pubDate: cachedEpisode.pubDate ? new Date(cachedEpisode.pubDate) : undefined });
                    }
                }
            }
        }

        return results;
    }

    removeFromSearchCache(term: string) {
        this.searchCache.del(`${term}_*`);
    }
}

export default new SearchFacade();