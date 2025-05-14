// tests/facade/searchFacade.test.ts

import searchFacade from '../../src/facade/searchFacade';
import configService from '../../src/service/configService';
import RedisCacheService from '../../src/service/redis/redisCacheService';
import getIplayerSearchService from '../../src/service/search/GetIplayerSearchService';
import nativeSearchService from '../../src/service/search/NativeSearchService';
import synonymService from '../../src/service/synonymService';
import { IPlayerSearchResult } from '../../src/types/IPlayerSearchResult';

// Mock dependencies
jest.mock('../../src/service/configService');
jest.mock('../../src/service/redis/redisCacheService');
jest.mock('../../src/service/synonymService');
jest.mock('../../src/service/search/NativeSearchService');
jest.mock('../../src/service/search/GetIplayerSearchService');

describe('SearchFacade', () => {
  const mockResults: IPlayerSearchResult[] = [
    { title: 'Test Show', series: 1, episode: 1, pubDate: new Date() } as IPlayerSearchResult,
    { title: 'Test Show 2', series: 2, episode: 1, pubDate: new Date() } as IPlayerSearchResult,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform a search and return filtered results', async () => {
    // Mock config to enable native search
    (configService.getParameter as jest.Mock).mockResolvedValue('true');

    // Mock synonym service to return no synonym
    (synonymService.getSynonym as jest.Mock).mockResolvedValue(undefined);

    // Mock Redis cache to return undefined (no cache hit)
    (RedisCacheService.prototype.get as jest.Mock).mockResolvedValue(undefined);

    // Mock native search service to return mock results
    (nativeSearchService.search as jest.Mock).mockResolvedValue(mockResults);
    (nativeSearchService.processCompletedSearch as jest.Mock).mockImplementation((results) => results);

    // Mock cache set
    (RedisCacheService.prototype.set as jest.Mock).mockResolvedValue(undefined);

    const results = await searchFacade.search('Test Show', 1, 1);

    expect(configService.getParameter).toHaveBeenCalledWith('NATIVE_SEARCH');
    expect(synonymService.getSynonym).toHaveBeenCalledWith('Test Show');
    expect(nativeSearchService.search).toHaveBeenCalledWith('Test Show', undefined);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Test Show');
    expect(results[0].series).toBe(1);
    expect(results[0].episode).toBe(1);
  });

  it('should use cached results if available', async () => {
    (configService.getParameter as jest.Mock).mockResolvedValue('true');
    (synonymService.getSynonym as jest.Mock).mockResolvedValue(undefined);

    (RedisCacheService.prototype.get as jest.Mock).mockResolvedValue(mockResults);

    (nativeSearchService.processCompletedSearch as jest.Mock).mockImplementation((results) => results);

    const results = await searchFacade.search('Test Show', 1, 1);

    expect(RedisCacheService.prototype.get).toHaveBeenCalled();
    expect(nativeSearchService.search).not.toHaveBeenCalled(); // Should not call search if cached
    expect(results).toHaveLength(1);
  });

  it('should fall back to getIplayerSearchService if native search disabled', async () => {
    (configService.getParameter as jest.Mock).mockResolvedValue('false');
    (synonymService.getSynonym as jest.Mock).mockResolvedValue(undefined);

    (RedisCacheService.prototype.get as jest.Mock).mockResolvedValue(undefined);

    (getIplayerSearchService.search as jest.Mock).mockResolvedValue(mockResults);
    (getIplayerSearchService.processCompletedSearch as jest.Mock).mockImplementation((results) => results);

    const results = await searchFacade.search('Test Show', 1, 1);

    expect(getIplayerSearchService.search).toHaveBeenCalled();
    expect(results).toHaveLength(1);
  });
});
