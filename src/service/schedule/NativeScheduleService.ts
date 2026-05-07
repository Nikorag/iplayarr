import axios from 'axios';
import https from 'https';
import { JSDOM } from 'jsdom';
import pLimit from 'p-limit';

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
import synonymService from '../synonymService';
import { AbstractScheduleService } from './AbstractScheduleService';

interface ScheduleProgramme {
    pid: string;
    title?: string;
    synopsis?: string;
    startDate: Date;
    endDate?: Date;
    source: 'json-ld' | 'markup';
}

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

        // Create a single axios instance with keep-alive agent
        const agent = new https.Agent({ keepAlive: true });
        const axiosInstance = axios.create({ httpsAgent: agent })

        const chunkLimit = pLimit(10);
        await Promise.all(
            chunks.map(chunk => chunkLimit(async () => {
                try {
                    const results = await iplayerDetailsService.details(chunk, axiosInstance);
                    chunkInfos.push(...results);
                } catch (error) {
                    loggingService.error(`Error fetching details for chunk ${chunk}: ${error}`);
                }

                completed++;
                const percent = Math.round((completed / chunks.length) * 100);
                const filledLength = Math.round((barLength * completed) / chunks.length);
                const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);
                loggingService.log(`Progress: [${bar}] ${percent}% (${completed}/${chunks.length})`);
            }))
        );

        loggingService.log(`Fetched details for ${chunkInfos.length} programmes.`);

        const results: IPlayerSearchResult[] = await Promise.all(
            chunkInfos.map(async (info: IPlayerDetails) => {
                const synonym = await synonymService.getSynonym(info.title);
                return NativeSearchService.createSearchResult(info.title, info, sizeFactor, synonym);
            })
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
            const now = new Date();

            const programmes = this.getScheduleProgrammesFromJsonLd(document, url);
            const scheduleProgrammes = programmes.length > 0
                ? programmes
                : this.getScheduleProgrammesFromMarkup(document, url);

            const pids = scheduleProgrammes
                .filter((programme) => {
                    if (programme.startDate > now) {
                        loggingService.debug(`Skipping future schedule programme from ${url}: ${programme.pid} starts ${programme.startDate.toISOString()}`);
                        return false;
                    }

                    return true;
                })
                .map((programme) => programme.pid)
                .filter((pid, index, allPids) => pid && allPids.indexOf(pid) === index);

            if (pids.length === 0) {
                loggingService.debug(`No schedule programme PIDs parsed from ${url}`);
            }

            return pids;
        } catch {
            loggingService.error(`Error fetching schedule page: ${url}`);
            return [];
        }
    }

    private getScheduleProgrammesFromJsonLd(document: Document, url: string): ScheduleProgramme[] {
        const programmes: ScheduleProgramme[] = [];
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

        scripts.forEach((script, scriptIndex) => {
            try {
                const text = script.textContent?.trim();
                if (!text || !text.includes('BroadcastEvent')) return;

                const parsed = JSON.parse(text) as unknown;
                const nodes = getJsonLdNodes(parsed);

                nodes.forEach((node, nodeIndex) => {
                    try {
                        const programme = parseJsonLdProgramme(node);
                        if (programme) programmes.push(programme);
                    } catch (error) {
                        loggingService.debug(`Skipping JSON-LD schedule programme from ${url} at script ${scriptIndex}, node ${nodeIndex}: ${getErrorMessage(error)}`);
                    }
                });
            } catch (error) {
                loggingService.debug(`Skipping JSON-LD schedule script from ${url} at index ${scriptIndex}: ${getErrorMessage(error)}`);
            }
        });

        return programmes;
    }

    private getScheduleProgrammesFromMarkup(document: Document, url: string): ScheduleProgramme[] {
        const programmes: ScheduleProgramme[] = [];
        const scheduleYear = getScheduleYearFromUrl(url) || new Date().getFullYear();
        const programmeElements = Array.from(document.querySelectorAll('.programme[data-pid], .programme__body[data-pid], [data-pid], .programme__titles a[href*="/programmes/"]'));

        programmeElements.forEach((element, index) => {
            try {
                const body = element.matches('.programme__body')
                    ? element
                    : element.closest('.programme__body') || element.querySelector('.programme__body') || element;
                const titleLink = element.matches('a[href*="/programmes/"]')
                    ? element
                    : body.querySelector('.programme__titles a') || element.querySelector('a[href*="/programmes/"]');
                const hrefPid = titleLink?.getAttribute('href')?.split('/').filter(Boolean).pop();
                const pid = element.getAttribute('data-pid') || hrefPid;
                if (!pid) {
                    loggingService.debug(`Skipping schedule programme markup from ${url} at index ${index}: missing data-pid or programme link`);
                    return;
                }

                const label = titleLink?.getAttribute('aria-label');
                const dateStr = label?.split(':').slice(0, 2).join(':').trim(); // e.g., "27 Apr 07:00"
                const startDate = dateStr ? parseDateString(dateStr, scheduleYear) : null;

                if (!startDate) {
                    loggingService.debug(`Skipping schedule programme markup from ${url} for ${pid}: missing or invalid start time`);
                    return;
                }

                programmes.push({
                    pid,
                    title: normaliseText(body.querySelector('.programme__title')?.textContent || titleLink?.textContent),
                    synopsis: normaliseText(body.querySelector('.programme__synopsis')?.textContent),
                    startDate,
                    source: 'markup',
                });
            } catch (error) {
                loggingService.debug(`Skipping schedule programme markup from ${url} at index ${index}: ${getErrorMessage(error)}`);
            }
        });

        return programmes;
    }
}

function parseJsonLdProgramme(node: unknown): ScheduleProgramme | null {
    if (!isRecord(node)) return null;

    const publication = getBroadcastPublication(node.publication);
    if (!publication) return null;

    const pid = typeof node.identifier === 'string' ? node.identifier : null;
    const startDate = parseIsoDate(publication.startDate);

    if (!pid || !startDate) return null;

    return {
        pid,
        title: typeof node.name === 'string' ? node.name : undefined,
        synopsis: typeof node.description === 'string' ? node.description : undefined,
        startDate,
        endDate: parseIsoDate(publication.endDate) || undefined,
        source: 'json-ld',
    };
}

function getJsonLdNodes(value: unknown): unknown[] {
    if (Array.isArray(value)) return value.flatMap(getJsonLdNodes);
    if (!isRecord(value)) return [];

    const graph = value['@graph'];
    if (Array.isArray(graph)) return graph;

    return [value];
}

function getBroadcastPublication(publication: unknown): Record<string, unknown> | null {
    const publications = Array.isArray(publication) ? publication : [publication];

    for (const item of publications) {
        if (!isRecord(item)) continue;

        const type = item['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes('BroadcastEvent')) return item;
    }

    return null;
}

function parseIsoDate(value: unknown): Date | null {
    if (typeof value !== 'string') return null;

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateString(dateStr: string, year: number): Date | null {
    const fullStr = `${dateStr} ${year}`;
    const parsed = new Date(Date.parse(fullStr));
    return isNaN(parsed.getTime()) ? null : parsed;
}

function getScheduleYearFromUrl(url: string): number | null {
    const match = url.match(/\/schedules\/[^/]+\/(\d{4})\//);
    if (!match) return null;

    const year = Number(match[1]);
    return Number.isInteger(year) ? year : null;
}

function normaliseText(value: string | null | undefined): string | undefined {
    const normalised = value?.replace(/\s+/g, ' ').trim();
    return normalised || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export default new NativeScheduleService();
