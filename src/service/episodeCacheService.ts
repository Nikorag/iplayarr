import axios from 'axios';
import { JSDOM } from 'jsdom';
import storage from 'node-persist';
import { v4 } from 'uuid';

import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../types/IPlayerSearchResult';
import { EpisodeCacheDefinition, IPlayerDataLayerResponse } from '../types/responses/EpisodeCacheTypes';
import { createNZBName, getQualityPofile, removeAllQueryParams, splitArrayIntoChunks } from '../utils/Utils';
import iplayerService from './iplayerService';

let isStorageInitialized : boolean = false;
const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}

const episodeCacheService = {
    initStorage : async () : Promise<void> => {
        if (!isStorageInitialized) {
            await storage.init(storageOptions);
            isStorageInitialized = true;
        }
    },

    getEpisodeCache : async (term : string) : Promise<IPlayerSearchResult[]> => {
        await episodeCacheService.initStorage();
        const result = (await storage.getItem(term))?.results || [];
	return result.map((sr : any) => ({...sr, pubDate : new Date(sr.pubDate)}));
    },

    getEpisodeCacheForUrl : async (url : string) : Promise<IPlayerSearchResult[]> => {
        await episodeCacheService.initStorage();
        const allStorage = await storage.values();
        const episodeCache = allStorage.find((item) => item.url && item.url == url);
        return episodeCache?.results || [];
    },
    getCachedSeries : async () : Promise<EpisodeCacheDefinition[]> => {
        await episodeCacheService.initStorage();
        return (await storage.getItem('series-cache-definition')) || [];
    },

    addCachedSeries : async (url : string, name : string) : Promise<void> => {
        const id = v4();
        const cachedSeries = await episodeCacheService.getCachedSeries();
        cachedSeries.push({url, name, id});
        await storage.setItem('series-cache-definition', cachedSeries);
    },

    updateCachedSeries : async (def : EpisodeCacheDefinition) : Promise<void> => {
        await episodeCacheService.removeCachedSeries(def.id);
        const cachedSeries = await episodeCacheService.getCachedSeries();
        cachedSeries.push(def);
        await storage.setItem('series-cache-definition', cachedSeries);
    },

    removeCachedSeries : async (id : string) : Promise<void> => {
        let cachedSeries = await episodeCacheService.getCachedSeries();
        cachedSeries = cachedSeries.filter(({id : savedId}) => savedId != id);
        await storage.setItem('series-cache-definition', cachedSeries);
    },

    recacheAllSeries : async () : Promise<boolean> => {
        const cachedSeries : EpisodeCacheDefinition[] = await episodeCacheService.getCachedSeries();
        for (const series of cachedSeries){
            await episodeCacheService.recacheSeries(series);
        }
        return true;
    },

    recacheSeries : async (series : EpisodeCacheDefinition) : Promise<void> => {
        await episodeCacheService.cacheEpisodesForUrl(series.url);
        series.cacheRefreshed = new Date();
        await episodeCacheService.updateCachedSeries(series);
    },

    cacheEpisodesForUrl : async (inputUrl : string) : Promise<boolean> => {
        await episodeCacheService.initStorage();
        const {sizeFactor} = await getQualityPofile();
        const url = removeAllQueryParams(inputUrl);

        const alreadyCached = await episodeCacheService.getEpisodeCacheForUrl(url);

        const seriesOverview : IPlayerDataLayerResponse | undefined = await episodeCacheService.getDetailScript(url);
        if (seriesOverview){
            const seriesIDs = seriesOverview.header.availableSlices
                .filter(({id}) => id != 'more-like-this')
                .map(({id}) => id);
            const seriesResponses = await Promise.all(
                seriesIDs.map((id) => episodeCacheService.getDetailScript(`${url}?seriesId=${id}`))
            );
            let episodes : any[] = [];
            for (const series of seriesResponses){
                episodes = [...episodes, ...(series as any).entities.results.map((s : any) => s.episode.id)];
            }

            //filter out only new ones
            episodes = episodes.filter((e) => !alreadyCached?.some(({pid}) => pid == e));

            const chunks = splitArrayIntoChunks(episodes, 20);
            const infos : IPlayerDetails[] = await chunks.reduce(async (accPromise, chunk) => {
                const acc = await accPromise; // Ensure previous results are awaited
                const results: IPlayerDetails[] = await iplayerService.details(chunk);
                return [...acc, ...results];
            }, Promise.resolve([])); // Initialize accumulator as a resolved Promise
            
            if (infos.length > 0){
                const title = infos[0].title;
                const results = await Promise.all(infos.map((info : IPlayerDetails) => createResult(title, info, sizeFactor)));
                await storage.setItem(title.toLowerCase(), {results : [...alreadyCached, ...results], url});
                return true;
            }
        }
        return false;
    },

    getDetailScript : async (url : string) : Promise<IPlayerDataLayerResponse | undefined> => {
        try {
            const {data} = await axios.get(url);

            const dom : JSDOM = new JSDOM(data);
            const document : Document = dom.window.document;

            const detailScript : Element | null = document.querySelector('#tvip-script-app-store');

            if (detailScript){
                const json = detailScript.innerHTML.replace('window.__IPLAYER_REDUX_STATE__ = ', '').replace(/;$/, '');
                const response : IPlayerDataLayerResponse = JSON.parse(json);
                return response
            }
        } catch {
            return;
        }
        return;
    }
}

async function createResult(term : string, details : IPlayerDetails, sizeFactor : number) : Promise<IPlayerSearchResult> {
    const size : number | undefined = details.runtime ? (details.runtime * 60) * sizeFactor : undefined;

    const nzbName = await createNZBName(VideoType.TV, {
        title: details.title.replaceAll(' ', '.'),
        season: details.series ? details.series.toString().padStart(2, '0') : undefined,
        episode: details.episode ? details.episode.toString().padStart(2, '0') : undefined,
    });

    return {
        number: 0,
        title: details.title,
        channel: details.channel || '',
        pid: details.pid,
        request: {
            term,
            line: term
        },
        episode: details.episode,
        pubDate: details.firstBroadcast ? new Date(details.firstBroadcast) : undefined,
        series: details.series,
        type: VideoType.TV,
        size,
        nzbName
    }
}

export default episodeCacheService
