import axios from 'axios';
import lunr from 'lunr';

import { IPlayerDetails } from '../types/data/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../types/data/IPlayerSearchResult';
import { EpisodeCacheDefinition } from '../types/models/EpisodeCacheDefinition';
import { IPlayerChilrenResponse } from '../types/responses/IPlayerMetadataResponse';
import { createNZBName, getQualityProfile, removeAllQueryParams, splitArrayIntoChunks } from '../utils/Utils';
import AbstractStorageService from './AbstractStorageService';
import iplayerService from './iplayerService';

let lunrIndex : lunr.Index;

class OffScheduleService extends AbstractStorageService<EpisodeCacheDefinition> {
    async buildIndex() : Promise<void> {
        //Build the lunr index
        const allEpisodeKeys = (await this.storage.keys())
            .filter((k) => k.startsWith('offSchedule_'))
            .map((k) => k.split('offSchedule_')[1]);
        lunrIndex = lunr(function (this : lunr.Builder) {
            this.ref('code');
            this.field('code');

            allEpisodeKeys.forEach((code) => this.add({code}));
        });
    }

    async searchCachedEpisodes(term : string) : Promise<IPlayerSearchResult[]> {
        await this.buildIndex();
        const lunrResult = lunrIndex.search(term);
        const results = await Promise.all(lunrResult.map(({ref}) => this.storage.getItem(`offSchedule_${ref}`)));
        return results.filter(res => res).map(({results}) => results).flat();
    }

    async recacheSeries(series : EpisodeCacheDefinition) : Promise<void> {
        await this.cacheEpisodeUrl(series.url);
        series.cacheRefreshed = new Date();
        await this.updateItem(series.id, series);
    }

    async recacheAllSeries() : Promise<boolean> {
        const cachedSeries : EpisodeCacheDefinition[] = await this.all();
        for (const series of cachedSeries){
            await this.recacheSeries(series);
        }
        return true;
    }

    async cacheEpisodeUrl(inputUrl : string) {
        await this.buildIndex();
        const {sizeFactor} = await getQualityProfile();

        const url : string = removeAllQueryParams(inputUrl);

        const brandPid = await iplayerService.findBrandForUrl(inputUrl);
        if (brandPid){
            const {data : {children : seriesList}} : {data : IPlayerChilrenResponse} = await axios.get(`https://www.bbc.co.uk/programmes/${encodeURIComponent(brandPid)}/children.json?limit=100`);
            const episodes = (await Promise.all(seriesList.programmes.filter(({type}) => type == 'series').map(({pid}) => iplayerService.getSeriesEpisodes(pid)))).flat();

            const chunks = splitArrayIntoChunks(episodes, 20);
            const infos : IPlayerDetails[] = await chunks.reduce(async (accPromise, chunk) => {
                const acc = await accPromise; // Ensure previous results are awaited
                const results: IPlayerDetails[] = await iplayerService.details(chunk);
                return [...acc, ...results];
            }, Promise.resolve([])); // Initialize accumulator as a resolved Promise
            
            if (infos.length > 0){
                const title = infos[0].title;
                const results = await Promise.all(infos.map((info : IPlayerDetails) => this.createResult(title, info, sizeFactor)));
                await this.storage.setItem(`offSchedule_${title.toLowerCase()}`, {results : [...results], url});
                return true;
            }
        } else {
            return false;
        }
        return false;
    }

    async createResult(term : string, details : IPlayerDetails, sizeFactor : number) : Promise<IPlayerSearchResult> {
        const size : number | undefined = details.runtime ? ((details.runtime * 60) * sizeFactor) / 100 : undefined;
    
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
}

export default new OffScheduleService('series-cache-definition')