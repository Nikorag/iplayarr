import axios from 'axios';

import SkyhookService from '../../src/service/skyhook/SkyhookService';

// src/service/skyhook/SkyhookService.test.ts

jest.mock('axios');
jest.mock('../../src/service/redis/redisCacheService');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SkyhookService URL construction', () => {
    let seriesCacheMock: any;
    let episodeCacheMock: any;

    beforeEach(() => {
        seriesCacheMock = {
            get: jest.fn(),
            set: jest.fn(),
        };
        episodeCacheMock = {
            get: jest.fn(),
            set: jest.fn(),
        };
        SkyhookService.skyhookSeriesCache = seriesCacheMock;
        SkyhookService.skyhookEpisodeCache = episodeCacheMock;
        jest.clearAllMocks();
    });

    it('searchSeries constructs correct URL and calls axios.get', async () => {
        const seriesName = 'Breaking Bad';
        seriesCacheMock.get.mockResolvedValue(undefined);
        mockedAxios.get.mockResolvedValue({ data: [{ tvdbId: '123' }] });

        await SkyhookService.searchSeries(seriesName);

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `https://skyhook.sonarr.tv/v1/tvdb/search/en?term=${seriesName}`
        );
    });

    it('searchSeries uses cache if available and does not call axios', async () => {
        const seriesName = 'Lost';
        seriesCacheMock.get.mockResolvedValue([{ tvdbId: '456' }]);

        await SkyhookService.searchSeries(seriesName);

        expect(mockedAxios.get).not.toHaveBeenCalledWith(
            `https://skyhook.sonarr.tv/v1/tvdb/search/en?term=${seriesName}`
        );
    });

    it('searchSeries falls back to axios when cache fails', async () => {
        const seriesName = 'Breaking Bad';
        seriesCacheMock.get.mockRejectedValue(new Error('Cache error'));
        mockedAxios.get.mockResolvedValue({ data: [{ tvdbId: '123' }] });

        const result = await SkyhookService.searchSeries(seriesName);

        expect(result).toEqual([{ tvdbId: '123' }]);
    });

    it('searchSeries returns empty array when axios fails', async () => {
        const seriesName = 'Breaking Bad';
        seriesCacheMock.get.mockResolvedValue(undefined);
        mockedAxios.get.mockRejectedValue(new Error('Network error'));

        const result = await SkyhookService.searchSeries(seriesName);

        expect(result).toEqual([]);
    });

    it('findEpisode constructs correct URL and calls axios.get on cache miss', async () => {
        const tvdbId = 789;
        const episodeName = 'Pilot';
        episodeCacheMock.get.mockResolvedValue(undefined);
        mockedAxios.get.mockResolvedValue({
            data: { episodes: [{ title: 'Pilot', seasonNumber: 1, episodeNumber: 1 }] }
        });

        await SkyhookService.findEpisode(tvdbId, episodeName);

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `https://skyhook.sonarr.tv/v1/tvdb/shows/en/${tvdbId}`
        );
    });

    it('findEpisode uses cache if available and does not call axios', async () => {
        const tvdbId = 101;
        const episodeName = 'Finale';
        episodeCacheMock.get.mockResolvedValue({
            episodes: [{ title: 'Finale', seasonNumber: 5, episodeNumber: 12 }]
        });

        await SkyhookService.findEpisode(tvdbId, episodeName);

        expect(mockedAxios.get).not.toHaveBeenCalledWith(
            `https://skyhook.sonarr.tv/v1/tvdb/shows/en/${tvdbId}`
        );
    });

    it('findEpisode returns undefined if episode not found', async () => {
        const tvdbId = 202;
        const episodeName = 'Nonexistent';
        episodeCacheMock.get.mockResolvedValue({
            episodes: [{ title: 'Other', seasonNumber: 1, episodeNumber: 1 }]
        });

        const result = await SkyhookService.findEpisode(tvdbId, episodeName);

        expect(result).toBeUndefined();
    });

    it('findEpisode falls back to axios when cache fails', async () => {
        const tvdbId = 789;
        const episodeName = 'Pilot';
        episodeCacheMock.get.mockRejectedValue(new Error('Cache error'));
        mockedAxios.get.mockResolvedValue({
            data: { episodes: [{ title: 'Pilot', seasonNumber: 1, episodeNumber: 1 }] }
        });

        const result = await SkyhookService.findEpisode(tvdbId, episodeName);

        expect(result).toEqual({ title: 'Pilot', seasonNumber: 1, episodeNumber: 1 });
    });

    it('findEpisode returns undefined when axios fails', async () => {
        const tvdbId = 789;
        const episodeName = 'Pilot';
        episodeCacheMock.get.mockResolvedValue(undefined);
        mockedAxios.get.mockRejectedValue(new Error('Network error'));

        const result = await SkyhookService.findEpisode(tvdbId, episodeName);

        expect(result).toBeUndefined();
    });
});