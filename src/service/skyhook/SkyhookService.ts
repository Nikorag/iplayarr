import axios from 'axios';

import RedisCacheService from '../redis/redisCacheService';

class SkyhookService {
    skyhookSeriesCache: RedisCacheService<{ tvdbId: string }[]>
    skyhookEpisodeCache: RedisCacheService<{ episodes: any[] } | undefined>

    constructor() {
        this.skyhookSeriesCache = new RedisCacheService('skyhook_series_cache', 2700);
        this.skyhookEpisodeCache = new RedisCacheService('skyhook_episode_cache', 86400);
    }

    async lookupSeriesDetails(seriesName: string, episodeTitle: string): Promise<{ series?: number, episode?: number } | undefined> {
        const searchResults = await this.searchSeries(seriesName);
        for (const result of searchResults) {
            const episode = await this.findEpisode(parseInt(result.tvdbId), episodeTitle);
            if (episode) {
                return { series: episode.seasonNumber, episode: episode.episodeNumber };
            }
        }
        return;
    }

    async searchSeries(seriesName: string): Promise<{ tvdbId: string }[]> {
        const cached = await this.skyhookSeriesCache.get(seriesName);
        if (cached) {
            return cached;
        }
        const url = `https://skyhook.sonarr.tv/v1/tvdb/search/en?term=${seriesName}`;
        const { data } = await axios.get(url);
        if (data && Array.isArray(data)) {
            await this.skyhookSeriesCache.set(seriesName, data);
        }
        return data;
    }

    async findEpisode(tvdbId: number, episodeName: string): Promise<{ title: string, seasonNumber: number, episodeNumber: number } | undefined> {
        const url = `https://skyhook.sonarr.tv/v1/tvdb/shows/en/${tvdbId}`;
        let data = await this.skyhookEpisodeCache.get(String(tvdbId));
        if (!data) {
            data = (await axios.get(url)).data;
            await this.skyhookEpisodeCache.set(String(tvdbId), data);
        }
        const episode = data?.episodes.find((ep: any) => ep.title?.toLowerCase() === episodeName?.toLowerCase());
        return episode;
    }
}

export default new SkyhookService();