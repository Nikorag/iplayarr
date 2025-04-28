import configService from '../service/configService';
import RedisCacheService from '../service/redisCacheService';
import AbstractSearchService from '../service/search/AbstractSearchService';
import getIplayerSearchService from '../service/search/GetIplayerSearchService';
import nativeSearchService from '../service/search/NativeSearchService';
import synonymService from '../service/synonymService';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerSearchResult } from '../types/IPlayerSearchResult';
import { Synonym } from '../types/Synonym';
import { removeLastFourDigitNumber } from '../utils/Utils';

interface SearchTerm {
    term: string;
    synonym?: Synonym;
}

class SearchFacade {
    searchCache: RedisCacheService<IPlayerSearchResult[]> = new RedisCacheService('search_cache', 300);

    async search(inputTerm: string, season?: number, episode?: number): Promise<IPlayerSearchResult[]> {
        const service: AbstractSearchService = await this.#getService();
        const { term, synonym } = await this.#getTerm(inputTerm, season);

        let results: IPlayerSearchResult[] | undefined = await this.searchCache.get(term);
        if (!results) {
            results = await service.search(term, synonym);
            this.searchCache.set(term, results as IPlayerSearchResult[]);
        } else {
            //Fix the results which are stored as string
            results.forEach((result) => {
                result.pubDate = result.pubDate ? new Date(result.pubDate as unknown as string) : undefined;
            });
        }

        const filteredResults = await this.#filterForSeasonAndEpisode(
            results as IPlayerSearchResult[],
            season,
            episode
        );

        const processedResults : IPlayerSearchResult[] = await service.processCompletedSearch(filteredResults, inputTerm, season, episode);

        return processedResults.filter(({ pubDate }) => !pubDate || pubDate < new Date());
    }

    async #getService(): Promise<AbstractSearchService> {
        const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);
        return nativeSearchEnabled == 'true' ? nativeSearchService : getIplayerSearchService;
    }

    async #getTerm(inputTerm: string, season?: number): Promise<SearchTerm> {
        const term = !season ? removeLastFourDigitNumber(inputTerm) : inputTerm;
        const synonym = await synonymService.getSynonym(inputTerm);
        return {
            term: synonym ? synonym.target : term,
            synonym,
        };
    }

    async #filterForSeasonAndEpisode(results: IPlayerSearchResult[], season?: number, episode?: number) {
        return results.filter((result) => {
            return (!season || result.series == season) && (!episode || result.episode == episode);
        });
    }

    removeFromSearchCache(term: string) {
        this.searchCache.del(term);
    }

    clearSearchCache() {
        this.searchCache.clear();
    }
}

export default new SearchFacade();