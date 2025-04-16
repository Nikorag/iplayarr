import axios from 'axios';

import { emptySearchResult } from '../../src/constants/iPlayarrConstants';
import configService from '../../src/service/configService';
import iplayerService from '../../src/service/iplayerService';
import RedisCacheService from '../../src/service/redisCacheService';
import searchService from '../../src/service/searchService';
import synonymService from '../../src/service/synonymService';
import { IplayarrParameter } from '../../src/types/IplayarrParameters';
import { SearchResponse } from '../../src/types/responses/SearchResponse';
import { Synonym } from '../../src/types/Synonym';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../src/service/iplayerService', () => ({
    details: jest.fn(),
    performSearch: jest.fn()
}));

jest.mock('src/service/configService', () => ({
    getParameter: jest.fn()
}));

jest.mock('src/service/synonymService', () => ({
    getSynonym: jest.fn()
}));

jest.mock('src/service/episodeCacheService', () => ({
    searchEpisodeCache: jest.fn(() => [])
}));

const mockCacheData: Record<string, any> = {};
jest.mock('src/service/redisCacheService', () => {
    const mockCacheInstance = {
        get: jest.fn((key: string) => {
            return Promise.resolve(mockCacheData[key] ? mockCacheData[key] : undefined);
        }),
        set: jest.fn((key: string, value: any) => {
            mockCacheData[key] = value;
            return Promise.resolve();
        }),
        del: jest.fn((key: string) => {
            delete mockCacheData[key];
            return Promise.resolve();
        })
    };
    return {
        default: jest.fn(() => mockCacheInstance),
        __esModule: true
    };
});

const mockRedisCacheService = (RedisCacheService as jest.Mock).mock.results[0].value;

describe('searchService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.keys(mockCacheData).forEach(k => delete mockCacheData[k]);
    });

    it('should return cached results if available', async () => {
        const term = 'testTerm';
        const pubDate: Date = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const cachedResults: SearchResponse = {...emptySearchResult, results : [{ title: 'Cached Result', pubDate } as any, { title: 'Without Date' } as any]};
        mockCacheData[`${term}_1`] = cachedResults;

        const results = await searchService.search(term);

        expect(results).toEqual(cachedResults);
        expect(mockRedisCacheService.get).toHaveBeenCalledWith(`${term}_1`);
        expect(iplayerService.performSearch).not.toHaveBeenCalled();
    });

    it('should perform a search if no cached results are available', async () => {
        const term = 'testTerm';
        const searchResults: SearchResponse = {...emptySearchResult, results : [{ title: 'Search Result' } as any]};
        (iplayerService.performSearch as jest.Mock).mockResolvedValue(searchResults);
        (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
            if (key === IplayarrParameter.NATIVE_SEARCH) return 'false';
        });

        const results = await searchService.search(term);

        expect(results).toEqual(searchResults);
        expect(mockRedisCacheService.get).toHaveBeenCalledWith(`${term}_1`);
        expect(iplayerService.performSearch).toHaveBeenCalledWith(term, undefined, 1);
        expect(mockRedisCacheService.set).toHaveBeenCalledWith(`${term}_1`, searchResults);
    });

    it('should filter results by season and episode', async () => {
        const pubDate: Date = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const term = 'testTerm';
        const season = 1;
        const episode = 1;
        const searchResults: SearchResponse = {...emptySearchResult, results : [
            { title: 'Result 1', series: 1, episode: 1, pubDate } as any,
            { title: 'Result 2', series: 1, episode: 2, pubDate } as any,
            { title: 'Result 3', series: 2, episode: 1, pubDate } as any,
        ]};
        mockCacheData[`${term}_1`] = searchResults;

        const results = await searchService.search(term, season, episode, 1);

        expect(results.results).toEqual([searchResults.results[0]]);
    });

    it('should use native search when enabled', async () => {
        const term = 'testTerm';
        const searchResults: SearchResponse = {
            ...emptySearchResult,
            results : [{ title: 'Search Result' } as any]
        };
        const mockPerformSearch = jest.spyOn(searchService, 'performSearch').mockResolvedValue(searchResults);
        (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
            if (key === IplayarrParameter.NATIVE_SEARCH) return 'true';
        });

        await searchService.search(term);

        expect(mockPerformSearch).toHaveBeenCalledWith(term, undefined, 1);
        mockPerformSearch.mockRestore();
    });

    it('should get a synonym when searching', async () => {
        const term = 'testTerm';
        const synonym: Synonym = { from: term, target: 'targetTerm' } as any;
        (synonymService.getSynonym as jest.Mock).mockResolvedValue(synonym);
        const searchResults: SearchResponse = {...emptySearchResult, results : [{ title: 'Search Result' } as any]};
        (iplayerService.performSearch as jest.Mock).mockResolvedValue(searchResults);
        (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
            if (key === IplayarrParameter.NATIVE_SEARCH) return 'false';
        });

        await searchService.search(term);

        expect(synonymService.getSynonym).toHaveBeenCalledWith(term);
        expect(iplayerService.performSearch).toHaveBeenCalledWith('targetTerm', synonym, 1);
    });

    it('should fallback to iPlayer search if there\'s an error', async () => {
        const term = 'testTerm';
        const synonym: Synonym = { from: term, target: 'targetTerm' } as any;
        (synonymService.getSynonym as jest.Mock).mockResolvedValue(synonym);
        
        const mockError = { message: 'Request failed' };
        mockedAxios.get.mockRejectedValue(mockError);
        const searchResults: SearchResponse = {...emptySearchResult, results : [{ title: 'Search Result' } as any]};
        (iplayerService.performSearch as jest.Mock).mockResolvedValue(searchResults);
        (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
            if (key === IplayarrParameter.NATIVE_SEARCH) return 'true';
            if (key === IplayarrParameter.VIDEO_QUALITY) return 'hd';
        });

        await searchService.search(term);

        expect(iplayerService.performSearch).toHaveBeenCalledWith('targetTerm', synonym, 1);
    });

    it('should use pids from the cache', async () => {
        const term = 'testTerm';
        const synonym: Synonym = { from: term, target: 'targetTerm' } as any;
        (synonymService.getSynonym as jest.Mock).mockResolvedValue(synonym);

        mockCacheData['targetTerm'] = ['mock_pid'];

        (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
            if (key === IplayarrParameter.NATIVE_SEARCH) return 'true';
            if (key === IplayarrParameter.VIDEO_QUALITY) return 'hd';
        });

        (iplayerService.details as jest.Mock).mockResolvedValue([])

        await searchService.search(term);

        expect(iplayerService.details).toHaveBeenCalledWith(['mock_pid']);
    });
});
