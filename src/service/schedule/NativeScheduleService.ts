import axios from 'axios';
import { JSDOM } from 'jsdom';

import { ChannelDefinition, ChannelSchedule } from '../../constants/ChannelSchedule';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import { IPlayerDetails } from '../../types/IPlayerDetails';
import { IPlayerSearchResult } from '../../types/IPlayerSearchResult';
import { getQualityProfile, splitArrayIntoChunks } from '../../utils/Utils';
import configService from '../configService';
import iplayerDetailsService from '../iplayerDetailsService';
import loggingService from '../loggingService';
import RedisCacheService from '../redis/redisCacheService';
import NativeSearchService from '../search/NativeSearchService';
import { AbstractScheduleService } from './AbstractScheduleService';

class NativeScheduleService implements AbstractScheduleService {
    scheduleCache: RedisCacheService<IPlayerSearchResult[]> = new RedisCacheService('schedule_cache', 5400);
    cacheTime: RedisCacheService<number> = new RedisCacheService('schedule_cache_time', 5400);
    caching: boolean = false;


    async refreshCache(): Promise<void> {
	const { sizeFactor } = await getQualityProfile();

        const rssHours: string = (await configService.getParameter(IplayarrParameter.RSS_FEED_HOURS)) as string;
        const dupedPids = await Promise.all(ChannelSchedule.map(channel => this.getChannelPids(channel, rssHours)));
        const pids = [...new Set(dupedPids.flat())];

        const chunks = splitArrayIntoChunks(pids, 5);
        const chunkInfos: IPlayerDetails[] = [];
        let completed = 0;
        const barLength = 20;

        await Promise.all(
            chunks.map(async (chunk) => {
                try {
                    const results: IPlayerDetails[] = await iplayerDetailsService.details(chunk);
                    chunkInfos.push(...results);
                } catch (error) {
                    loggingService.error(`Error fetching details for chunk ${chunk}: ${error}`);
                }
                // Progress bar logging (after each chunk finishes)
                completed++;
                const percent = Math.round((completed / chunks.length) * 100);
                const filledLength = Math.round((barLength * completed) / chunks.length);
                const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
                loggingService.log(`Progress: [${bar}] ${percent}% (${completed}/${chunks.length})`);
            })
        );

        const results: IPlayerSearchResult[] = await Promise.all(
            chunkInfos.map((info: IPlayerDetails) => NativeSearchService.createSearchResult(info.title, info, sizeFactor, undefined))
        );

        this.scheduleCache.set('schedule', results);
        this.cacheTime.set('last_cached', Date.now());
    }

    async getFeed(): Promise<IPlayerSearchResult[]> {
        const lastCachedEpoch = await this.cacheTime.get('last_cached');

        if (!lastCachedEpoch || (lastCachedEpoch + 2700 * 1000) < Date.now()) {
            if (!this.caching) {
	        this.caching = true;
                this.refreshCache().then(() => this.caching = false);
	    }
        }

        const results = await this.scheduleCache.get('schedule');
        if (!results) {
            loggingService.error('No results found in schedule cache');
            return [];
        }

        results.forEach((result) => {
            result.pubDate = result.pubDate ? new Date(result.pubDate as unknown as string) : undefined;
        });

        return results;
    }

    async getChannelPids({ id, name }: ChannelDefinition, rssHours: string): Promise<string[]> {
        const hours = parseInt(rssHours);
        const days = Math.ceil(hours / 24);

        const date = new Date();
        date.setDate(date.getDate() - days - 1);

        const allPids: Set<string> = new Set();

        while (date.getDate() != new Date().getDate()) {
            date.setDate(date.getDate() + 1);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            const url = `https://www.bbc.co.uk/schedules/${id}/${year}/${month}/${day}`;

            loggingService.log(`Fetching schedule for ${name} on ${year}-${month}-${day}... ${url}`);
            const pids = await this.getPidsFromSchedulePage(url);
            pids.forEach(pid => allPids.add(pid));
        }

        return Array.from(allPids);
    }

    async getPidsFromSchedulePage(url: string): Promise<string[]> {
        try {
            const response = await axios.get(url);
            const dom = new JSDOM(response.data);
            const document = dom.window.document;
            const titles = Array.from(document.querySelectorAll('.programme__titles a'));

            const now = new Date();

            const filtered = titles.filter((titleElement) => {
                const label = titleElement.getAttribute('aria-label');
                if (!label) return false;

                const dateStr = label.split(':')[0].trim(); // e.g., "27 Apr 07:00"
                const parsedDate = parseDateString(dateStr);

                if (!parsedDate) return false;

                return parsedDate <= now; // keep only if not in the future
            }).map((titleElement) => {
                const href = titleElement.getAttribute('href');
                return href?.split('/').pop() || ''; // Extract the PID from the URL
            });

            return filtered;
        } catch {
            loggingService.error(`Error fetching schedule page: ${url}`);
            return [];
        }
    }
}

function parseDateString(dateStr: string): Date | null {
    const currentYear = new Date().getFullYear();
    const fullStr = `${dateStr} ${currentYear}`;
    const parsed = new Date(Date.parse(fullStr));
    return isNaN(parsed.getTime()) ? null : parsed;
}

export default new NativeScheduleService();
