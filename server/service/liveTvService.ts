import axios from 'axios';
import pLimit from 'p-limit';
import { Builder } from 'xml2js';

import { LiveChannel, LiveChannels } from '../constants/LiveChannels';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { isLiveTvMode, LiveTvMode } from '../types/LiveTv';
import CacheService from './cache/cacheService';
import configService from './configService';

const MEDIA_SELECTOR = 'https://open.live.bbc.co.uk/mediaselector/6/select/version/2.0/mediaset/iptv-all/vpid';
const IBL_BASE = 'https://ibl.api.bbc.co.uk/ibl/v1';

/** Stream locations are cheap to resolve but not worth looking up for every segment request */
const STREAM_TTL_SECONDS = 300;
const GUIDE_TTL_SECONDS = 3600;
/** The guide covers yesterday (iPlayer's schedule day runs 05:00-05:00), today and tomorrow */
const GUIDE_DAY_OFFSETS = [-1, 0, 1];

interface Programme {
    start: string;
    end: string;
    title: string;
    subtitle?: string;
    description?: string;
    category?: string;
}

const streamCache = new CacheService<string[]>('live_tv_streams', STREAM_TTL_SECONDS);
const baseCache = new CacheService<string>('live_tv_bases', STREAM_TTL_SECONDS);
const guideCache = new CacheService<Programme[]>('live_tv_guide', GUIDE_TTL_SECONDS);

/** iPlayer's schedule is keyed by UK calendar date */
const ukDate = (offsetDays: number): string => {
    const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(date);
};

/** XMLTV timestamps: YYYYMMDDHHMMSS +0000 */
const xmltvTime = (iso: string): string =>
    `${new Date(iso).toISOString().replace(/[-:T]/g, '').slice(0, 14)} +0000`;

const escapeAttribute = (value: string): string => value.replace(/"/g, '\'').replace(/[\r\n]+/g, ' ');

const liveTvService = {
    async isEnabled(): Promise<boolean> {
        return (await configService.getParameter(IplayarrParameter.LIVE_TV_ENABLED)) == 'true';
    },

    /** The mode asked for in the request if valid, otherwise the configured default */
    async getMode(requested?: unknown): Promise<LiveTvMode> {
        if (isLiveTvMode(requested)) {
            return requested;
        }
        const configured = await configService.getParameter(IplayarrParameter.LIVE_TV_MODE);
        return isLiveTvMode(configured) ? configured : 'redirect';
    },

    /**
     * The BBC's HLS master playlist URLs for a channel, best CDN first. Several suppliers are offered so that
     * proxying can fall back to another if one is unavailable.
     */
    async resolveStreams(channel: LiveChannel): Promise<string[]> {
        const cached = await streamCache.get(channel.id);
        if (cached) {
            return cached;
        }
        const { data } = await axios.get(`${MEDIA_SELECTOR}/${channel.vpid}/format/json`, { timeout: 10000 });
        const connections: { priority: string; protocol: string; transferFormat: string; href: string }[] = (
            data?.media ?? []
        ).flatMap((media: any) => media.connection ?? []);
        const urls = connections
            .filter(({ transferFormat, protocol }) => transferFormat === 'hls' && protocol === 'https')
            .sort((a, b) => Number(a.priority) - Number(b.priority))
            .map(({ href }) => href);
        if (urls.length == 0) {
            throw new Error(`No live stream available for ${channel.name}`);
        }
        await streamCache.set(channel.id, urls);
        return urls;
    },

    /** The directory that a channel's playlists and segments are relative to, for the CDN last used by the proxy */
    async getProxyBase(channel: LiveChannel): Promise<string> {
        const base = await baseCache.get(channel.id);
        if (base) {
            return base;
        }
        return liveTvService.baseOf((await liveTvService.resolveStreams(channel))[0]);
    },

    rememberProxyBase(channel: LiveChannel, masterUrl: string): Promise<void> {
        return baseCache.set(channel.id, liveTvService.baseOf(masterUrl));
    },

    baseOf(masterUrl: string): string {
        return masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);
    },

    /**
     * Playlists use relative URLs, which keep working through the proxy as they resolve against the proxied
     * playlist's own URL. Any absolute URL inside the CDN directory is made relative so it does too.
     */
    rewritePlaylist(playlist: string, base: string): string {
        const relative = (uri: string) => (uri.startsWith(base) ? uri.substring(base.length) : uri);
        return playlist
            .split(/\r?\n/)
            .map((line) => {
                if (line.startsWith('#')) {
                    return line.replace(/URI="([^"]*)"/g, (_, uri) => `URI="${relative(uri)}"`);
                }
                return relative(line);
            })
            .join('\n');
    },

    buildPlaylist(baseUrl: string, apiKey: string, mode?: LiveTvMode): string {
        const query = mode ? `?mode=${mode}` : '';
        const entries = LiveChannels.map(
            (channel, index) =>
                `#EXTINF:-1 tvg-id="${channel.id}" tvg-chno="${index + 1}" tvg-name="${escapeAttribute(channel.name)}" group-title="BBC",${channel.name}\n` +
                `${baseUrl}/tv/${apiKey}/stream/${channel.id}/index.m3u8${query}`
        );
        return `#EXTM3U\n${entries.join('\n')}\n`;
    },

    async getProgrammes(channel: LiveChannel): Promise<Programme[]> {
        return guideCache.getOr(channel.id, async () => {
            const days = await Promise.all(
                GUIDE_DAY_OFFSETS.map(async (offset) => {
                    try {
                        const { data } = await axios.get(`${IBL_BASE}/channels/${channel.iblId}/schedule/${ukDate(offset)}`, {
                            timeout: 15000,
                        });
                        return (data?.schedule?.elements ?? []) as any[];
                    } catch {
                        // A missing day shouldn't take the rest of the guide down
                        return [];
                    }
                })
            );
            const seen = new Set<string>();
            return days
                .flat()
                .filter(({ id, scheduled_start, scheduled_end, episode }) => {
                    if (!id || !scheduled_start || !scheduled_end || !episode?.title || seen.has(id)) {
                        return false;
                    }
                    seen.add(id);
                    return true;
                })
                .map(({ scheduled_start, scheduled_end, episode }) => ({
                    start: scheduled_start,
                    end: scheduled_end,
                    title: episode.title,
                    subtitle: episode.subtitle,
                    description: episode.synopses?.medium ?? episode.synopses?.small,
                    category: episode.labels?.category,
                }));
        });
    },

    /** XMLTV programme guide for Jellyfin's Live TV */
    async buildGuide(): Promise<string> {
        const limit = pLimit(4);
        const schedules = await Promise.all(
            LiveChannels.map((channel) => limit(async () => ({ channel, programmes: await liveTvService.getProgrammes(channel) })))
        );

        const tv = {
            $: { 'generator-info-name': 'iPlayarr' },
            channel: LiveChannels.map(({ id, name }) => ({ $: { id }, 'display-name': name })),
            programme: schedules.flatMap(({ channel, programmes }) =>
                programmes.map((programme) => ({
                    $: { start: xmltvTime(programme.start), stop: xmltvTime(programme.end), channel: channel.id },
                    title: { $: { lang: 'en' }, _: programme.title },
                    ...(programme.subtitle ? { 'sub-title': { $: { lang: 'en' }, _: programme.subtitle } } : {}),
                    ...(programme.description ? { desc: { $: { lang: 'en' }, _: programme.description } } : {}),
                    ...(programme.category ? { category: { $: { lang: 'en' }, _: programme.category } } : {}),
                }))
            ),
        };

        return new Builder({ xmldec: { version: '1.0', encoding: 'UTF-8' } }).buildObject({ tv });
    },
};

export default liveTvService;
