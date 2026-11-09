import axios from 'axios';
import https from 'https';
import { JSDOM } from 'jsdom';
import pLimit from 'p-limit';

import { ChannelDefinition, ChannelSchedule } from '../../constants/ChannelSchedule';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import { IPlayerDetails } from '../../types/IPlayerDetails';
import { IPlayerSearchResult } from '../../types/IPlayerSearchResult';
import { getQualityProfile, splitArrayIntoChunks } from '../../utils/Utils';
import CacheService from '../cache/cacheService';
import configService from '../configService';
import iplayerDetailsService from '../iplayerDetailsService';
import loggingService from '../loggingService';
import NativeSearchService from '../search/NativeSearchService';
import synonymService from '../synonymService';
import { AbstractScheduleService } from './AbstractScheduleService';

// How long a cached feed is served before a background refresh is started
const STALE_AFTER_MS = 2700 * 1000;
// A failing refresh (BBC rate limiting, outage) must not be retried on every request
const MIN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
// The last good feed is kept far longer than it is considered fresh, so a run of failed refreshes
// degrades to a stale feed rather than an empty one
const FEED_RETENTION_SECONDS = 24 * 60 * 60;
const SCHEDULE_PAGE_ATTEMPTS = 3;
const MAX_RETRY_DELAY_MS = 30 * 1000;
const RETRYABLE_NETWORK_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'EAI_AGAIN', 'ENOTFOUND', 'ECONNREFUSED'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class NativeScheduleService implements AbstractScheduleService {
    scheduleCache: CacheService<IPlayerSearchResult[]> = new CacheService('schedule_cache', FEED_RETENTION_SECONDS);
    cacheTime: CacheService<number> = new CacheService('schedule_cache_time', FEED_RETENTION_SECONDS);
    caching: boolean = false;
    lastRefreshAttempt: number = 0;
    // Schedule pages that could not be loaded (after retries) during the current refresh
    failedPages: number = 0;
    retryBaseDelayMs: number = 1000;

    async refreshCache(): Promise<void> {
        if (this.caching) {
            loggingService.log('A schedule refresh is already running, skipping this one');
            return;
        }
        this.caching = true;
        this.lastRefreshAttempt = Date.now();
        try {
            await this.#refresh();
        } finally {
            this.caching = false;
        }
    }

    async #refresh(): Promise<void> {
        this.failedPages = 0;
        const { sizeFactor } = await getQualityProfile();

        const rssHours: string = (await configService.getParameter(IplayarrParameter.RSS_FEED_HOURS)) as string;
        const scheduleLimit = pLimit(5);
        const dupedPids = await Promise.all(ChannelSchedule.map(channel => scheduleLimit(() => this.getChannelPids(channel, rssHours))));
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

        const previous = await this.scheduleCache.get('schedule');
        // Pages the BBC refused to serve leave gaps, so fill them from the previous feed rather than
        // replacing a good feed with a partial one
        const feed = this.failedPages > 0 ? this.#mergeWithPrevious(results, previous, rssHours) : results;

        if (feed.length === 0 && previous?.length) {
            loggingService.error(
                `Schedule refresh found no programmes (${this.failedPages} pages failed), keeping the previous feed`
            );
            this.cacheTime.set('last_cached', this.#retrySoonTimestamp());
            return;
        }

        await this.scheduleCache.set('schedule', feed);
        if (this.failedPages > 0) {
            loggingService.error(
                `${this.failedPages} schedule pages could not be loaded, the feed is incomplete and will be refreshed again shortly`
            );
            await this.cacheTime.set('last_cached', this.#retrySoonTimestamp());
        } else {
            await this.cacheTime.set('last_cached', Date.now());
        }
    }

    // A "last cached" time that makes the feed count as stale again after MIN_REFRESH_INTERVAL_MS
    #retrySoonTimestamp(): number {
        return Date.now() - (STALE_AFTER_MS - MIN_REFRESH_INTERVAL_MS);
    }

    // New results win, previous ones are kept (unless older than the RSS window) for anything a failed page hid
    #mergeWithPrevious(
        results: IPlayerSearchResult[],
        previous: IPlayerSearchResult[] | undefined,
        rssHours: string
    ): IPlayerSearchResult[] {
        const cutoff = Date.now() - parseInt(rssHours) * 60 * 60 * 1000;
        const merged = new Map<string, IPlayerSearchResult>();
        for (const result of previous ?? []) {
            const pubDate = result.pubDate ? new Date(result.pubDate as unknown as string).getTime() : undefined;
            if (pubDate === undefined || isNaN(pubDate) || pubDate >= cutoff) {
                merged.set(result.pid, result);
            }
        }
        for (const result of results) {
            merged.set(result.pid, result);
        }
        return [...merged.values()];
    }

    async getFeed(): Promise<IPlayerSearchResult[]> {
        const lastCachedEpoch = await this.cacheTime.get('last_cached');

        const stale = !lastCachedEpoch || lastCachedEpoch + STALE_AFTER_MS < Date.now();
        if (stale && !this.caching && Date.now() - this.lastRefreshAttempt >= MIN_REFRESH_INTERVAL_MS) {
            // Serve what we have now and refresh in the background. A failure here must be reported, not
            // left as an unhandled rejection (which takes the whole process down).
            this.refreshCache().catch((error) => {
                loggingService.error(`Schedule refresh failed: ${error?.message ?? error}`);
            });
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

        while (date.toDateString() !== new Date().toDateString()) {
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
            const data = await this.#fetchWithRetry(url);
            const dom = new JSDOM(data);
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
        } catch (error) {
            this.failedPages++;
            loggingService.error(`Error fetching schedule page: ${url} — ${error}`);
            return [];
        }
    }

    // The BBC rate limits (429) when many schedule pages are requested together, and it sometimes has a bad
    // moment (5xx, dropped connection), so retry those with a delay instead of silently losing the page.
    async #fetchWithRetry(url: string): Promise<string> {
        for (let attempt = 1; ; attempt++) {
            try {
                return (await axios.get(url)).data;
            } catch (error) {
                if (attempt >= SCHEDULE_PAGE_ATTEMPTS || !this.#isRetryable(error)) {
                    throw error;
                }
                const delay = this.#retryDelayMs(error, attempt);
                loggingService.log(
                    `Schedule page ${url} failed (${this.#describe(error)}), retrying in ${Math.round(delay / 1000)}s (attempt ${attempt}/${SCHEDULE_PAGE_ATTEMPTS})`
                );
                await sleep(delay);
            }
        }
    }

    #isRetryable(error: any): boolean {
        const status = error?.response?.status;
        if (status !== undefined) {
            return status === 429 || status >= 500;
        }
        // No response at all: only retry genuine network failures, not programming errors
        return RETRYABLE_NETWORK_CODES.includes(error?.code);
    }

    #retryDelayMs(error: any, attempt: number): number {
        const retryAfter = error?.response?.headers?.['retry-after'];
        if (retryAfter !== undefined) {
            const seconds = Number(retryAfter);
            const ms = !isNaN(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
            if (!isNaN(ms) && ms >= 0) {
                return Math.min(ms, MAX_RETRY_DELAY_MS);
            }
        }
        return Math.min(this.retryBaseDelayMs * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
    }

    #describe(error: any): string {
        return error?.response?.status ? `HTTP ${error.response.status}` : (error?.code ?? error?.message ?? 'unknown error');
    }
}

function parseDateString(dateStr: string): Date | null {
    const currentYear = new Date().getFullYear();
    const fullStr = `${dateStr} ${currentYear}`;
    const parsed = new Date(Date.parse(fullStr));
    return isNaN(parsed.getTime()) ? null : parsed;
}

export default new NativeScheduleService();
