import axios from 'axios';

import configService from '../../src/service/configService';
import episodeCacheService from '../../src/service/episodeCacheService';
import iplayerService from '../../src/service/iplayerService';
import RedisCacheService from '../../src/service/redisCacheService';
import { SearchService } from '../../src/service/searchService'
import { IplayarrParameter } from '../../src/types/IplayarrParameters';
import { IPlayerDetails } from '../../src/types/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../../src/types/IPlayerSearchResult';
import { IPlayerNewSearchResponse } from '../../src/types/responses/iplayer/IPlayerNewSearchResponse';

const mockCache: Record<string, any> = {};

jest.mock('../../src/service/redisCacheService', () => {
    const mockRedisCacheService = {
        get: jest.fn((key: string) => Promise.resolve(mockCache[key])),
        set: jest.fn((key: string, value: any) => {
            mockCache[key] = value;
            return Promise.resolve();
        }),
        del: jest.fn((key: string) => {
            delete mockCache[key];
            return Promise.resolve();
        }),
    };

    return {
        __esModule: true,
        default: jest.fn(() => mockRedisCacheService),
    };
});


const mockCacheService = (RedisCacheService as jest.Mock).mock.results[0].value;

jest.mock('../../src/service/configService', () => ({
    __esModule: true,
    default: {
        getParameter: jest.fn()
    }
}));

jest.mock('../../src/service/iplayerService', () => ({
    __esModule: true,
    default: {
        performSearch: jest.fn(),
        details: jest.fn()
    },
}));
const mockedIPlayerService = iplayerService as jest.Mocked<typeof iplayerService>;

jest.mock('../../src/service/episodeCacheService', () => ({
    __esModule: true,
    default: {
        findBrandForPid: jest.fn(),
    },
}));
const mockedEpisodeCacheService = episodeCacheService as jest.Mocked<typeof episodeCacheService>;

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SearchService', () => {
    let searchService: SearchService;

    beforeEach(() => {
        searchService = new SearchService();
        Object.keys(mockCache).forEach(k => delete mockCache[k]);
        jest.clearAllMocks();
    });

    describe('search', () => {
        it('should return cached results if available', async () => {
            const term = 'test';
            const cachedResults: IPlayerSearchResult[] = [{
                number: 0,
                title: 'Test Title',
                channel: 'Test Channel',
                pid: 'test-pid',
                request: { term, line: term },
                episode: 1,
                pubDate: new Date(),
                series: 1,
                type: VideoType.TV,
                size: 100,
                nzbName: 'test.nzb'
            }];

            mockCache[term] = cachedResults;
            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.NATIVE_SEARCH) return 'true';
            });

            const results = await searchService.search(term);

            expect(results).toEqual(cachedResults);
            expect(mockCacheService.get).toHaveBeenCalledWith(term);
            expect(iplayerService.performSearch).not.toHaveBeenCalled();
        });

        it('should perform search if no cached results', async () => {
            const term = 'test';
            const searchResults: IPlayerSearchResult[] = [{
                number: 0,
                title: 'Test Title',
                channel: 'Test Channel',
                pid: 'test-pid',
                request: { term, line: term },
                episode: 1,
                pubDate: new Date(),
                series: 1,
                type: VideoType.TV,
                size: 100,
                nzbName: 'test.nzb'
            }];

            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.NATIVE_SEARCH) return 'false';
            });
            mockedIPlayerService.performSearch.mockResolvedValue(searchResults);

            const results = await searchService.search(term);

            expect(results).toEqual(searchResults);
            expect(mockCacheService.get).toHaveBeenCalledWith(term);
            expect(mockedIPlayerService.performSearch).toHaveBeenCalledWith(term, undefined);
            expect(mockCacheService.set).toHaveBeenCalledWith(term, searchResults);
        });
    });

    describe('performSearch', () => {
        it('should return search results from iplayerService', async () => {
            const term = 'test';
            const title = 'Test Title';
            const pubDate = new Date();
            const searchResult = {
                number: 0,
                title,
                channel: 'Test Channel',
                pid: 'test-pid',
                request: { term, line: term },
                episode: 1,
                pubDate,
                series: 1,
                type: VideoType.TV,
                size: 100,
                nzbName: 'test.nzb'
            };

            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.TV_FILENAME_TEMPLATE) return 'TV - {{title}} - {{quality}}';
                if (key === IplayarrParameter.MOVIE_FILENAME_TEMPLATE) return 'Movie - {{title}} - {{quality}}';
                if (key === IplayarrParameter.VIDEO_QUALITY) return 'hd';
            });

            mockedAxios.get.mockResolvedValue({
                status: 200,
                data: {
                    new_search: {
                        results: [{ id: 'test-id' }]
                    }
                } as IPlayerNewSearchResponse
            });
            mockedEpisodeCacheService.findBrandForPid.mockResolvedValue(undefined);
            mockedIPlayerService.details.mockResolvedValue([{
                title: 'Test Title',
                channel: 'Test Channel',
                pid: 'test-pid',
                episode: 1,
                series: 1,
                runtime: 100,
                firstBroadcast: new Date().toISOString()
            } as IPlayerDetails]);

            const results = await searchService.performSearch(term);

            expect(results).toEqual([{
                ...searchResult,
                request: { term : title, line: title },
                size: 3660,
                nzbName: 'TV - Test.Title - 720p'
            }]);
            expect(mockedAxios.get).toHaveBeenCalledWith(`https://ibl.api.bbc.co.uk/ibl/v1/new-search?q=${encodeURIComponent(term)}`);
            expect(mockedIPlayerService.details).toHaveBeenCalledWith(['test-id']);
        });
    });
});