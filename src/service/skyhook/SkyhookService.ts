import axios from 'axios';

import RedisCacheService from '../redis/redisCacheService';

// Skyhook rejects requests carrying axios's default User-Agent (axios/x.x.x) with a 400,
// presumably bot mitigation aimed at generic HTTP clients. It's Sonarr's own metadata
// service, so identify as Sonarr rather than spoofing a browser.
const SKYHOOK_REQUEST_CONFIG = { headers: { 'User-Agent': 'Sonarr' } };

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
        try {
            const cached = await this.skyhookSeriesCache.get(seriesName);
            if (cached) {
                return cached;
            }
        } catch {
            // Cache retrieval failed, continue to API lookup
        }

        try {
            const url = `https://skyhook.sonarr.tv/v1/tvdb/search/en?term=${encodeURIComponent(seriesName)}`;
            const { data } = await axios.get(url, SKYHOOK_REQUEST_CONFIG);
            if (data && Array.isArray(data)) {
                await this.skyhookSeriesCache.set(seriesName, data);
            }
            return data;
        } catch {
            return [];
        }
    }

    async findEpisode(tvdbId: number, episodeName: string): Promise<{ title: string, seasonNumber: number, episodeNumber: number } | undefined> {
        const url = `https://skyhook.sonarr.tv/v1/tvdb/shows/en/${tvdbId}`;
        let data;

        try {
            data = await this.skyhookEpisodeCache.get(String(tvdbId));
        } catch {
            // Cache retrieval failed, continue to API lookup
        }

        if (!data) {
            try {
                const response = await axios.get(url, SKYHOOK_REQUEST_CONFIG);
                data = response.data;
                await this.skyhookEpisodeCache.set(String(tvdbId), data);
            } catch {
                return undefined;
            }
        }

        const episode = data?.episodes.find((ep: any) => ep.title?.toLowerCase() === episodeName?.toLowerCase());
        return episode;
    }
}

export default new SkyhookService();