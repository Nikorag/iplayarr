// tests/facade/searchFacade.test.ts

import searchFacade from '../../server/facade/searchFacade';
import CacheService from '../../server/service/cache/cacheService';
import configService from '../../server/service/configService';
import metricsService from '../../server/service/metricsService';
import getIplayerSearchService from '../../server/service/search/GetIplayerSearchService';
import nativeSearchService from '../../server/service/search/NativeSearchService';
import synonymService from '../../server/service/synonymService';
import { IPlayerSearchResult } from '../../server/types/IPlayerSearchResult';

// Mock dependencies
jest.mock('../../server/service/configService');
jest.mock('../../server/service/cache/cacheService');
jest.mock('../../server/service/synonymService');
jest.mock('../../server/service/search/NativeSearchService');
jest.mock('../../server/service/search/GetIplayerSearchService');

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

    // Mock cache to return undefined (no cache hit)
    (CacheService.prototype.get as jest.Mock).mockResolvedValue(undefined);

    // Mock native search service to return mock results
    (nativeSearchService.search as jest.Mock).mockResolvedValue(mockResults);
    (nativeSearchService.processCompletedSearch as jest.Mock).mockImplementation((results) => results);

    // Mock cache set
    (CacheService.prototype.set as jest.Mock).mockResolvedValue(undefined);

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

    (CacheService.prototype.get as jest.Mock).mockResolvedValue(mockResults);

    (nativeSearchService.processCompletedSearch as jest.Mock).mockImplementation((results) => results);

    const results = await searchFacade.search('Test Show', 1, 1);

    expect(CacheService.prototype.get).toHaveBeenCalled();
    expect(nativeSearchService.search).not.toHaveBeenCalled(); // Should not call search if cached
    expect(results).toHaveLength(1);
  });

  it('should fall back to getIplayerSearchService if native search disabled', async () => {
    (configService.getParameter as jest.Mock).mockResolvedValue('false');
    (synonymService.getSynonym as jest.Mock).mockResolvedValue(undefined);

    (CacheService.prototype.get as jest.Mock).mockResolvedValue(undefined);

    (getIplayerSearchService.search as jest.Mock).mockResolvedValue(mockResults);
    (getIplayerSearchService.processCompletedSearch as jest.Mock).mockImplementation((results) => results);

    const results = await searchFacade.search('Test Show', 1, 1);

    expect(getIplayerSearchService.search).toHaveBeenCalled();
    expect(results).toHaveLength(1);
  });

  describe('metrics', () => {
    const searches = () => metricsService.collect().find(({ name }) => name == 'iplayarr_searches_total')?.samples;

    beforeEach(() => {
      metricsService.reset();
      (synonymService.getSynonym as jest.Mock).mockResolvedValue(undefined);
      (CacheService.prototype.get as jest.Mock).mockResolvedValue(undefined);
    });

    it('records a successful search against the active backend', async () => {
      (configService.getParameter as jest.Mock).mockResolvedValue('true');
      (nativeSearchService.search as jest.Mock).mockResolvedValue(mockResults);
      (nativeSearchService.processCompletedSearch as jest.Mock).mockImplementation((results) => results);

      await searchFacade.search('Test Show');

      expect(searches()).toEqual([{ labels: { source: 'native', outcome: 'success' }, value: 1 }]);
    });

    it('records a failed search and still throws', async () => {
      (configService.getParameter as jest.Mock).mockResolvedValue('false');
      (getIplayerSearchService.search as jest.Mock).mockRejectedValue(new Error('exit 2'));

      await expect(searchFacade.search('Test Show')).rejects.toThrow('exit 2');

      expect(searches()).toEqual([{ labels: { source: 'get_iplayer', outcome: 'error' }, value: 1 }]);
    });

    it('does not count a cache hit as a search', async () => {
      (configService.getParameter as jest.Mock).mockResolvedValue('true');
      (CacheService.prototype.get as jest.Mock).mockResolvedValue(mockResults);
      (nativeSearchService.processCompletedSearch as jest.Mock).mockImplementation((results) => results);

      await searchFacade.search('Test Show');

      expect(searches()).toEqual([]);
    });
  });
});
