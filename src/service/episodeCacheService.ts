import lunr from 'lunr';
import { v4 } from 'uuid';

import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../types/IPlayerSearchResult';
import { QueuedStorage } from '../types/QueuedStorage';
import { EpisodeCacheDefinition } from '../types/responses/EpisodeCacheTypes';
import { IPlayerEpisodeMetadata } from '../types/responses/IPlayerMetadataResponse';
import { createNZBName, getQualityProfile, removeAllQueryParams, sanitizeLunrQuery, splitArrayIntoChunks } from '../utils/Utils';
import iplayerDetailsService from './iplayerDetailsService';

const storage: QueuedStorage = new QueuedStorage();
let lunrIndex: lunr.Index;

const episodeCacheService = {
    buildIndex: async (): Promise<void> => {
        const allEpisodeKeys = (await storage.keys())
            .filter((k) => k.startsWith('offSchedule_'))
            .map((k) => k.split('offSchedule_')[1]);

        //Build the lunr index
        lunrIndex = lunr(function (this: lunr.Builder) {
            this.ref('code');
            this.field('code');

            allEpisodeKeys.forEach((code) => this.add({ code }));
        });
    },

    getEpisodeCache: async (term: string): Promise<IPlayerSearchResult[]> => {
        await episodeCacheService.buildIndex();
        const result = (await storage.getItem(term))?.results || [];
        return result.map((sr: any) => ({ ...sr, pubDate: new Date(sr.pubDate) }));
    },

    searchEpisodeCache: async (term: string): Promise<IPlayerSearchResult[]> => {
        await episodeCacheService.buildIndex();
        const sanitizedTerm = sanitizeLunrQuery(term);
        if (!sanitizedTerm) {
            return [];
        }
        const lunrResult = lunrIndex.search(sanitizedTerm);
        const results = await Promise.all(lunrResult.map(({ ref }) => storage.getItem(`offSchedule_${ref}`)));
        return results
            .filter((res) => res)
            .map(({ results }) => results)
            .flat();
    },

    getEpisodeCacheForUrl: async (url: string): Promise<IPlayerSearchResult[]> => {
        await episodeCacheService.buildIndex();
        const allStorage = await storage.values();
        const episodeCache = allStorage.find((item) => item.url && item.url == url);
        return episodeCache?.results || [];
    },

    getCachedSeries: async (): Promise<EpisodeCacheDefinition[]> => {
        await episodeCacheService.buildIndex();
        return (await storage.getItem('series-cache-definition')) || [];
    },

    getCachedSeriesForId: async (id: string): Promise<EpisodeCacheDefinition | undefined> => {
        const all = await episodeCacheService.getCachedSeries();
        return all.find(({ id: storedId }) => storedId == id);
    },

    addCachedSeries: async (url: string, name: string): Promise<void> => {
        const id = v4();
        const cachedSeries = await episodeCacheService.getCachedSeries();
        cachedSeries.push({ url, name, id });
        await storage.setItem('series-cache-definition', cachedSeries);
    },

    updateCachedSeries: async (def: EpisodeCacheDefinition): Promise<void> => {
        //Move old record
        const oldRecord = await episodeCacheService.getCachedSeriesForId(def.id);
        if (oldRecord) {
            const oldEpisodes = await storage.getItem(oldRecord.name);
            await storage.setItem(def.name, oldEpisodes);
            await storage.removeItem(oldRecord.name);
        }

        await episodeCacheService.removeCachedSeries(def.id);
        const cachedSeries = await episodeCacheService.getCachedSeries();
        cachedSeries.push(def);
        await storage.setItem('series-cache-definition', cachedSeries);
    },

    removeCachedSeries: async (id: string): Promise<void> => {
        //Remove old record
        const oldRecord = await episodeCacheService.getCachedSeriesForId(id);
        if (oldRecord) {
            await storage.removeItem(oldRecord.name);
        }

        let cachedSeries = await episodeCacheService.getCachedSeries();
        cachedSeries = cachedSeries.filter(({ id: savedId }) => savedId != id);
        await storage.setItem('series-cache-definition', cachedSeries);
    },

    recacheAllSeries: async (): Promise<boolean> => {
        const cachedSeries: EpisodeCacheDefinition[] = await episodeCacheService.getCachedSeries();
        for (const series of cachedSeries) {
            await episodeCacheService.recacheSeries(series);
        }
        return true;
    },

    recacheSeries: async (series: EpisodeCacheDefinition): Promise<void> => {
        await episodeCacheService.cacheEpisodesForUrl(series.url);
        series.cacheRefreshed = new Date();
        await episodeCacheService.updateCachedSeries(series);
    },

    cacheEpisodesForUrl: async (inputUrl: string): Promise<boolean> => {
        await episodeCacheService.buildIndex();
        const { sizeFactor } = await getQualityProfile();

        const url = removeAllQueryParams(inputUrl);

        const brandPid = await iplayerDetailsService.findBrandForUrl(inputUrl);
        if (brandPid) {
            let infos: IPlayerDetails[] = [];

            const seriesList: IPlayerEpisodeMetadata[] = await iplayerDetailsService.getSeriesEpisodes(brandPid);

            const episodes = (await Promise.all(seriesList.filter(({ type }) => type == 'series').map(({ id }) => iplayerDetailsService.getSeriesEpisodes(id)))).flat();
            episodes.push(...seriesList.filter(({ type, release_date_time }) => type == 'episode' && release_date_time != null));

            const chunks = splitArrayIntoChunks(episodes, 5);

            const chunkInfos: IPlayerDetails[] = [];
            for (const chunk of chunks) {
                const results: IPlayerDetails[] = await iplayerDetailsService.detailsForEpisodeMetadata(chunk);
                chunkInfos.push(...results);
            }

            infos = [...infos, ...chunkInfos];

            if (infos.length > 0) {
                const title = infos[0].title;
                const results = await Promise.all(
                    infos.map((info: IPlayerDetails) => createResult(title, info, sizeFactor))
                );
                await storage.setItem(`offSchedule_${title.toLowerCase()}`, { results: [...results], url });
                return true;
            }
        } else {
            return false;
        }
        return false;
    }
};

async function createResult(term: string, details: IPlayerDetails, sizeFactor: number): Promise<IPlayerSearchResult> {
    const size: number | undefined = details.runtime
        ? Math.floor((details.runtime * 60 * sizeFactor) / 100)
        : undefined;
    const nzbName = await createNZBName(details);
    return {
        number: 0,
        title: details.title,
        channel: details.channel || '',
        pid: details.pid,
        request: {
            term,
            line: term,
        },
        episode: details.episode,
        episodeTitle: details.episodeTitle,
        pubDate: details.firstBroadcast ? new Date(details.firstBroadcast) : undefined,
        series: details.series,
        type: VideoType.TV,
        size,
        nzbName,
    };
}

export default episodeCacheService;
