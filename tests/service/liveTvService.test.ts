import axios from 'axios';
import { parseStringPromise } from 'xml2js';

import { LiveChannels } from '../../server/constants/LiveChannels';
import configService from '../../server/service/configService';
import liveTvService from '../../server/service/liveTvService';
import { clearMemoryCaches } from '../helpers/memoryCache';

jest.mock('axios');
jest.mock('../../server/service/configService');
jest.mock('../../server/service/cache/cacheService', () => ({
    __esModule: true,
    default: jest.requireActual('../helpers/memoryCache').MemoryCache,
}));

const channel = LiveChannels[0];
const conn = (transferFormat: string, protocol: string, priority: string, href: string) => ({
    transferFormat,
    protocol,
    priority,
    href,
});

describe('liveTvService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        clearMemoryCaches();
    });

    describe('getMode / isEnabled', () => {
        it('prefers a valid requested mode', async () => {
            expect(await liveTvService.getMode('proxy')).toBe('proxy');
            expect(configService.getParameter).not.toHaveBeenCalled();
        });

        it('falls back to the configured mode when the request is missing or invalid', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue('proxy');
            expect(await liveTvService.getMode(undefined)).toBe('proxy');
            expect(await liveTvService.getMode('nonsense')).toBe('proxy');
        });

        it('defaults to redirect if the configured mode is invalid', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue('weird');
            expect(await liveTvService.getMode()).toBe('redirect');
        });

        it('is enabled only when LIVE_TV_ENABLED is true', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('true').mockResolvedValueOnce('false');
            expect(await liveTvService.isEnabled()).toBe(true);
            expect(await liveTvService.isEnabled()).toBe(false);
        });
    });

    describe('resolveStreams', () => {
        it('returns https HLS master playlists ordered by priority, and caches them', async () => {
            (axios.get as jest.Mock).mockResolvedValue({
                data: {
                    media: [
                        { connection: [conn('dash', 'https', '10', 'https://a/x.mpd')] },
                        {
                            connection: [
                                conn('hls', 'https', '20', 'https://cloudfront/x/iptv.m3u8'),
                                conn('hls', 'http', '10', 'http://akamai/x/iptv.m3u8'),
                                conn('hls', 'https', '10', 'https://akamai/x/iptv.m3u8'),
                            ],
                        },
                    ],
                },
            });

            const urls = await liveTvService.resolveStreams(channel);

            expect(urls).toEqual(['https://akamai/x/iptv.m3u8', 'https://cloudfront/x/iptv.m3u8']);
            expect((axios.get as jest.Mock).mock.calls[0][0]).toContain(`/vpid/${channel.vpid}/format/json`);

            await liveTvService.resolveStreams(channel);
            expect(axios.get).toHaveBeenCalledTimes(1);
        });

        it('throws when no HLS stream is offered', async () => {
            (axios.get as jest.Mock).mockResolvedValue({ data: { media: [] } });

            await expect(liveTvService.resolveStreams(channel)).rejects.toThrow('No live stream available for BBC One');
        });
    });

    describe('proxy base', () => {
        it('uses the CDN directory last proxied successfully, else the best stream', async () => {
            (axios.get as jest.Mock).mockResolvedValue({
                data: { media: [{ connection: [conn('hls', 'https', '10', 'https://akamai/x/iptv.m3u8')] }] },
            });
            expect(await liveTvService.getProxyBase(channel)).toBe('https://akamai/x/');

            await liveTvService.rememberProxyBase(channel, 'https://fastly/y/iptv.m3u8');
            expect(await liveTvService.getProxyBase(channel)).toBe('https://fastly/y/');
        });
    });

    describe('rewritePlaylist', () => {
        const base = 'https://cdn/x/';

        it('leaves relative playlists alone', () => {
            const playlist = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nt=1/main.m3u8\n';
            expect(liveTvService.rewritePlaylist(playlist, base)).toBe(playlist);
        });

        it('makes absolute URLs inside the CDN directory relative, including URI attributes', () => {
            const playlist = [
                '#EXTM3U',
                '#EXT-X-MAP:URI="https://cdn/x/init.mp4"',
                'https://cdn/x/seg1.ts',
                'https://elsewhere/seg2.ts',
            ].join('\n');

            expect(liveTvService.rewritePlaylist(playlist, base)).toBe(
                ['#EXTM3U', '#EXT-X-MAP:URI="init.mp4"', 'seg1.ts', 'https://elsewhere/seg2.ts'].join('\n')
            );
        });
    });

    describe('buildPlaylist', () => {
        it('lists every channel with its stream URL', () => {
            const m3u = liveTvService.buildPlaylist('http://iplayarr:4404', 'KEY');
            const lines = m3u.trim().split('\n');

            expect(lines[0]).toBe('#EXTM3U');
            expect(lines).toHaveLength(1 + LiveChannels.length * 2);
            expect(lines[1]).toBe(
                '#EXTINF:-1 tvg-id="bbc-one" tvg-chno="1" tvg-name="BBC One" group-title="BBC",BBC One'
            );
            expect(lines[2]).toBe('http://iplayarr:4404/tv/KEY/stream/bbc-one/index.m3u8');
        });

        it('carries a mode override on every stream URL', () => {
            const m3u = liveTvService.buildPlaylist('http://iplayarr:4404', 'KEY', 'proxy');
            const urls = m3u.split('\n').filter((line) => line.startsWith('http'));

            expect(urls).toHaveLength(LiveChannels.length);
            urls.forEach((url) => expect(url).toMatch(/\/index\.m3u8\?mode=proxy$/));
        });
    });

    describe('buildGuide', () => {
        const element = (id: string, title: string, start: string, end: string, extra: any = {}) => ({
            id,
            scheduled_start: start,
            scheduled_end: end,
            episode: { title, ...extra },
        });

        it('builds XMLTV with every channel and de-duplicated programmes', async () => {
            (axios.get as jest.Mock).mockImplementation(async (url: string) => {
                if (!url.includes('/channels/bbc_one_london/')) {
                    return { data: { schedule: { elements: [] } } };
                }
                return {
                    data: {
                        schedule: {
                            elements: [
                                element('p1', 'News', '2026-10-30T18:00:00.000Z', '2026-10-30T18:30:00.000Z', {
                                    subtitle: 'At Six',
                                    synopses: { small: 'Short', medium: 'Medium' },
                                    labels: { category: 'News' },
                                }),
                                // Appears in two days' schedules
                                element('p1', 'News', '2026-10-30T18:00:00.000Z', '2026-10-30T18:30:00.000Z'),
                                { id: 'p2', scheduled_start: 'x' }, // incomplete
                            ],
                        },
                    },
                };
            });

            const xml = await liveTvService.buildGuide();
            const { tv } = await parseStringPromise(xml);

            expect(tv.channel.map((c: any) => c.$.id)).toEqual(LiveChannels.map(({ id }) => id));
            expect(tv.channel[0]['display-name'][0]).toBe('BBC One');
            expect(tv.programme).toHaveLength(1);

            const programme = tv.programme[0];
            expect(programme.$).toEqual({ start: '20261030180000 +0000', stop: '20261030183000 +0000', channel: 'bbc-one' });
            expect(programme.title[0]._).toBe('News');
            expect(programme['sub-title'][0]._).toBe('At Six');
            expect(programme.desc[0]._).toBe('Medium');
            expect(programme.category[0]._).toBe('News');
        });

        it('still returns a guide when a schedule day fails to load', async () => {
            (axios.get as jest.Mock).mockRejectedValue(new Error('boom'));

            const { tv } = await parseStringPromise(await liveTvService.buildGuide());

            expect(tv.channel).toHaveLength(LiveChannels.length);
            expect(tv.programme).toBeUndefined();
        });
    });
});
