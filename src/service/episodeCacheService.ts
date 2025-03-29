import axios, { AxiosResponse } from 'axios';
import { v4 } from 'uuid';

import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../types/IPlayerSearchResult';
import { QueuedStorage } from '../types/QueuedStorage'
import { EpisodeCacheDefinition } from '../types/responses/EpisodeCacheTypes';
import { IPlayerChilrenResponse, IPlayerMetadataResponse } from '../types/responses/IPlayerMetadataResponse';
import { createNZBName, getQualityPofile, removeAllQueryParams, splitArrayIntoChunks } from '../utils/Utils';
import iplayerService from './iplayerService';
const storage : QueuedStorage = new QueuedStorage();

let isStorageInitialized : boolean = false;
const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}

const PID_REGEX = /\/([a-z0-9]{8})(?:\/|$)/

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

        const brandPid = await episodeCacheService.findBrandForUrl(inputUrl);
        if (brandPid){
            const {data : {children : seriesList}} : {data : IPlayerChilrenResponse} = await axios.get(`https://www.bbc.co.uk/programmes/${brandPid}/children.json?limit=100`);
            const episodes = (await Promise.all(seriesList.programmes.filter(({type}) => type == 'series').map(({pid}) => episodeCacheService.getSeriesEpisodes(pid)))).flat();

            const chunks = splitArrayIntoChunks(episodes, 20);
            const infos : IPlayerDetails[] = await chunks.reduce(async (accPromise, chunk) => {
                const acc = await accPromise; // Ensure previous results are awaited
                const results: IPlayerDetails[] = await iplayerService.details(chunk);
                return [...acc, ...results];
            }, Promise.resolve([])); // Initialize accumulator as a resolved Promise
            
            if (infos.length > 0){
                const title = infos[0].title; // FIX THIS!
                const results = await Promise.all(infos.map((info : IPlayerDetails) => createResult(title, info, sizeFactor)));
                await storage.setItem(title.toLowerCase(), {results : [...alreadyCached, ...results], url});
                return true;
            }
        } else {
            return false;
        }
        return false;
    },

    getSeriesEpisodes : async (pid : string) : Promise<string[]> => {
        try {
            const response : AxiosResponse<IPlayerChilrenResponse> = await axios.get(`https://www.bbc.co.uk/programmes/${pid}/children.json?limit=100`);
            return response.data.children.programmes.map(({pid}) => pid);
        } catch {
            return [];
        }
    },

    findBrandForUrl : async (url : string) : Promise<string | undefined> => {
        const match = url.replace('/episodes', '').match(PID_REGEX);
        if (match){
            const pid = match[1];
            return await episodeCacheService.findBrandForPid(pid);
        }
    },

    findBrandForPid : async (pid : string, checked : string[] = []) : Promise<string | undefined> => {
        const {programme} : IPlayerMetadataResponse = await episodeCacheService.getMetadata(pid);
        if (programme.type == 'brand'){
            return programme.pid;
        } else if (programme.parent) {
            if (!checked.includes(programme.parent.programme.pid) && programme.parent.programme.pid != pid){
                return await episodeCacheService.findBrandForPid(programme.parent.programme.pid, [...checked, pid]);
            }
        }
        return undefined;
    },

    getMetadata : async (pid : string) : Promise<IPlayerMetadataResponse> => {
        const {data} : {data : IPlayerMetadataResponse} = await axios.get(`https://www.bbc.co.uk/programmes/${pid}.json`);
        return data;
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
