
import episodeCacheService from '../../src/service/episodeCacheService';
import iplayerDetailsService from '../../src/service/iplayerDetailsService';
import { EpisodeCacheDefinition } from '../../src/types/responses/EpisodeCacheTypes';

jest.mock('../../src/service/iplayerDetailsService');
jest.mock('../../src/utils/Utils', () => ({
    createNZBName: jest.fn(() => Promise.resolve('mocked-nzb-name')),
    getQualityProfile: jest.fn(() => Promise.resolve({ sizeFactor: 100 })),
    removeAllQueryParams: jest.fn((url) => url),
    splitArrayIntoChunks: jest.fn((arr) => [arr]),
}));

jest.mock('../../src/types/QueuedStorage', () => {
    const data = new Map();
    return {
        QueuedStorage: jest.fn().mockImplementation(() => ({
            keys: jest.fn(() => Promise.resolve(Array.from(data.keys()))),
            getItem: jest.fn((key) => Promise.resolve(data.get(key))),
            setItem: jest.fn((key, value) => {
                data.set(key, value);
                return Promise.resolve();
            }),
            removeItem: jest.fn((key) => {
                data.delete(key);
                return Promise.resolve();
            }),
            values: jest.fn(() => Promise.resolve(Array.from(data.values()))),
        })),
    };
});

describe('episodeCacheService', () => {
    const dummyDetail = {
        title: 'Test Show',
        channel: 'BBC One',
        pid: '1234',
        episode: 1,
        episodeTitle: 'Pilot',
        pubDate: '2023-01-01T00:00:00Z',
        series: 1,
        type: 'series',
        runtime: 3600,
        firstBroadcast: '2023-01-01T00:00:00Z',
    };

    const dummyMetadata = {
        id: '1234',
        type: 'episode',
        release_date_time: '2023-01-01T00:00:00Z',
    };

    beforeEach(() => {
        jest.clearAllMocks();

        (iplayerDetailsService.findBrandForUrl as jest.Mock).mockResolvedValue('abcd');
        (iplayerDetailsService.getSeriesEpisodes as jest.Mock).mockResolvedValue([dummyMetadata]);
        (iplayerDetailsService.detailsForEpisodeMetadata as jest.Mock).mockResolvedValue([dummyDetail]);
    });

    it('should cache episodes for a given URL', async () => {
        const result = await episodeCacheService.cacheEpisodesForUrl('https://www.bbc.co.uk/programmes/abcd');
        expect(result).toBe(true);
    });

    it('should return false when brandPid is not found', async () => {
        (iplayerDetailsService.findBrandForUrl as jest.Mock).mockResolvedValue(undefined);
        const result = await episodeCacheService.cacheEpisodesForUrl('invalid');
        expect(result).toBe(false);
    });

    it('should get episode cache by term', async () => {
        await episodeCacheService.cacheEpisodesForUrl('https://www.bbc.co.uk/programmes/abcd');
        const result = await episodeCacheService.getEpisodeCache('offSchedule_test show');
        expect(result.length).toBeGreaterThan(0);
    });

    it('should search episode cache by term', async () => {
        await episodeCacheService.cacheEpisodesForUrl('https://www.bbc.co.uk/programmes/abcd');
        const result = await episodeCacheService.searchEpisodeCache('test');
        expect(Array.isArray(result)).toBe(true);
    });

    it('should get episode cache for URL', async () => {
        await episodeCacheService.cacheEpisodesForUrl('https://www.bbc.co.uk/programmes/abcd');
        const result = await episodeCacheService.getEpisodeCacheForUrl('https://www.bbc.co.uk/programmes/abcd');
        expect(Array.isArray(result)).toBe(true);
    });

    it('should add, retrieve, update, and remove cached series', async () => {
        await episodeCacheService.addCachedSeries('url', 'Test Show');
        const all = await episodeCacheService.getCachedSeries();
        expect(all.length).toBe(1);

        const id = all[0].id;
        const series: EpisodeCacheDefinition | undefined = await episodeCacheService.getCachedSeriesForId(id);
        expect(series?.name).toBe('Test Show');

        await episodeCacheService.updateCachedSeries({ ...series, name: 'Test Show 2' } as EpisodeCacheDefinition);
        const updated = await episodeCacheService.getCachedSeriesForId(id);
        expect(updated?.name).toBe('Test Show 2');

        await episodeCacheService.removeCachedSeries(id);
        const final = await episodeCacheService.getCachedSeries();
        expect(final.length).toBe(0);
    });

    it('should recache all series', async () => {
        await episodeCacheService.addCachedSeries('url', 'Test Show');
        const result = await episodeCacheService.recacheAllSeries();
        expect(result).toBe(true);
    });

    it('should recache a specific series', async () => {
        const series = { url: 'url', name: 'Test Show', id: 'id', cacheRefreshed: undefined };
        await episodeCacheService.recacheSeries(series);
        expect(series.cacheRefreshed).toBeInstanceOf(Date);
    });
});
