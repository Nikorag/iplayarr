import axios from 'axios';
import request from 'supertest';

import guideRoute from '../../server/routes/tv/[key]/guide.xml.get';
import playlistRoute from '../../server/routes/tv/[key]/playlist.m3u.get';
import streamRoute from '../../server/routes/tv/[key]/stream/[channel]/[...path].get';
import configService from '../../server/service/configService';
import { IplayarrParameter } from '../../server/types/IplayarrParameters';
import { makeEvent, nodeApp } from '../helpers/h3';
import { clearMemoryCaches } from '../helpers/memoryCache';

jest.mock('axios');
jest.mock('../../server/service/configService');
jest.mock('../../server/service/cache/cacheService', () => ({
    __esModule: true,
    default: jest.requireActual('../helpers/memoryCache').MemoryCache,
}));

const app = nodeApp([
    ['get', '/tv/:key/playlist.m3u', playlistRoute],
    ['get', '/tv/:key/guide.xml', guideRoute],
    ['get', '/tv/:key/stream/:channel/**:path', streamRoute],
]);

const AKAMAI = 'https://akamai.example/x=4/i=urn:bbc:pips:service:bbc_one_london/';
const FASTLY = 'https://fastly.example/x=4/i=urn:bbc:pips:service:bbc_one_london/';
const MASTER = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nt=1/main.m3u8\n';

/** supertest only buffers text content types, so read the body as text explicitly */
const getText = (path: string, headers: Record<string, string> = {}) =>
    request(app)
        .get(path)
        .set(headers)
        .buffer(true)
        .parse((res, callback) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => callback(null, data));
        });

const config = (values: Record<string, string>) =>
    (configService.getParameter as jest.Mock).mockImplementation(async (key: IplayarrParameter) => values[key]);

const mediaSelector = () =>
    (axios.get as jest.Mock).mockImplementation(async (url: string) => {
        if (url.includes('mediaselector')) {
            return {
                data: {
                    media: [
                        {
                            connection: [
                                { transferFormat: 'hls', protocol: 'https', priority: '10', href: `${AKAMAI}iptv.m3u8` },
                                { transferFormat: 'hls', protocol: 'https', priority: '20', href: `${FASTLY}iptv.m3u8` },
                            ],
                        },
                    ],
                },
            };
        }
        return { data: { schedule: { elements: [] } } };
    });

const upstream = (routes: Record<string, { body?: string; status?: number; type?: string }>) =>
    jest.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
        const route = routes[String(input)];
        if (!route) {
            return new Response('not found', { status: 404 });
        }
        return new Response(route.body ?? '', {
            status: route.status ?? 200,
            headers: { 'content-type': route.type ?? 'application/vnd.apple.mpegurl' },
        });
    });

describe('Live TV routes', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
        clearMemoryCaches();
        config({ LIVE_TV_ENABLED: 'true', LIVE_TV_MODE: 'redirect', API_KEY: 'secret' });
        mediaSelector();
    });

    describe('access', () => {
        it.each(['/tv/secret/playlist.m3u', '/tv/secret/guide.xml', '/tv/secret/stream/bbc-one/index.m3u8'])(
            '404s %s when Live TV is disabled',
            async (path) => {
                config({ LIVE_TV_ENABLED: 'false', API_KEY: 'secret' });

                expect((await request(app).get(path)).status).toBe(404);
            }
        );

        it.each(['/tv/wrong/playlist.m3u', '/tv/wrong/guide.xml', '/tv/wrong/stream/bbc-one/index.m3u8', '/tv/s/playlist.m3u'])(
            '401s %s with the wrong key',
            async (path) => {
                expect((await request(app).get(path)).status).toBe(401);
            }
        );

        it('401s when no API key is configured, even for an empty key segment', async () => {
            config({ LIVE_TV_ENABLED: 'true' });

            expect((await request(app).get('/tv/anything/playlist.m3u')).status).toBe(401);
        });
    });

    describe('GET playlist.m3u', () => {
        it('serves an M3U whose URLs point back at the host it was requested on', async () => {
            const res = await getText('/tv/secret/playlist.m3u', { Host: 'iplayarr.lan:4404' });

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('audio/x-mpegurl');
            expect(res.body).toContain('http://iplayarr.lan:4404/tv/secret/stream/bbc-one/index.m3u8\n');
            expect(res.body).not.toContain('?mode=');
        });

        it('carries a valid mode override and ignores an invalid one', async () => {
            const proxied = await getText('/tv/secret/playlist.m3u?mode=proxy');
            expect(proxied.body).toContain('/index.m3u8?mode=proxy');

            const invalid = await getText('/tv/secret/playlist.m3u?mode=bogus');
            expect(invalid.body).not.toContain('?mode=');
        });

        it('respects forwarded host and protocol from a reverse proxy', async () => {
            const res = await getText('/tv/secret/playlist.m3u', {
                'X-Forwarded-Host': 'tv.example.com',
                'X-Forwarded-Proto': 'https',
            });

            expect(res.body).toContain('https://tv.example.com/tv/secret/stream/bbc-one/index.m3u8');
        });
    });

    describe('GET guide.xml', () => {
        it('serves XMLTV', async () => {
            const res = await request(app).get('/tv/secret/guide.xml');

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('application/xml');
            expect(res.text).toContain('<channel id="bbc-one">');
        });
    });

    describe('GET stream (redirect mode)', () => {
        it('redirects the master playlist straight to the BBC', async () => {
            const fetchSpy = upstream({});

            const res = await request(app).get('/tv/secret/stream/bbc-one/index.m3u8').redirects(0);

            expect(res.status).toBe(302);
            expect(res.headers.location).toBe(`${AKAMAI}iptv.m3u8`);
            expect(fetchSpy).not.toHaveBeenCalled();
        });

        it('404s an unknown channel', async () => {
            expect((await request(app).get('/tv/secret/stream/nope/index.m3u8')).status).toBe(404);
        });

        it('502s when the BBC has no stream', async () => {
            (axios.get as jest.Mock).mockResolvedValue({ data: { media: [] } });

            const res = await request(app).get('/tv/secret/stream/bbc-one/index.m3u8');

            expect(res.status).toBe(502);
        });
    });

    describe('GET stream (proxy mode)', () => {
        it('proxies the master playlist when the mode is configured', async () => {
            config({ LIVE_TV_ENABLED: 'true', LIVE_TV_MODE: 'proxy', API_KEY: 'secret' });
            upstream({ [`${AKAMAI}iptv.m3u8`]: { body: MASTER } });

            const res = await request(app).get('/tv/secret/stream/bbc-one/index.m3u8').redirects(0);

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('application/vnd.apple.mpegurl');
            expect(res.text).toBe(MASTER);
        });

        it('lets the request override a redirect default with ?mode=proxy', async () => {
            upstream({ [`${AKAMAI}iptv.m3u8`]: { body: MASTER } });

            const res = await request(app).get('/tv/secret/stream/bbc-one/index.m3u8?mode=proxy').redirects(0);

            expect(res.status).toBe(200);
            expect(res.text).toBe(MASTER);
        });

        it('lets the request override a proxy default with ?mode=redirect', async () => {
            config({ LIVE_TV_ENABLED: 'true', LIVE_TV_MODE: 'proxy', API_KEY: 'secret' });

            const res = await request(app).get('/tv/secret/stream/bbc-one/index.m3u8?mode=redirect').redirects(0);

            expect(res.status).toBe(302);
        });

        it('falls back to the next CDN when the first fails, then keeps using it for sub-requests', async () => {
            upstream({
                [`${AKAMAI}iptv.m3u8`]: { status: 503 },
                [`${FASTLY}iptv.m3u8`]: { body: MASTER },
                [`${FASTLY}t=1/main.m3u8`]: { body: '#EXTM3U\n1.ts\n' },
            });

            const master = await request(app).get('/tv/secret/stream/bbc-one/index.m3u8?mode=proxy');
            expect(master.status).toBe(200);

            const media = await request(app).get('/tv/secret/stream/bbc-one/t=1/main.m3u8');
            expect(media.status).toBe(200);
            expect(media.text).toBe('#EXTM3U\n1.ts\n');
        });

        it('502s when every CDN fails', async () => {
            upstream({});

            const res = await request(app).get('/tv/secret/stream/bbc-one/index.m3u8?mode=proxy');

            expect(res.status).toBe(502);
        });

        it('rewrites absolute URLs in proxied playlists to relative ones', async () => {
            upstream({ [`${AKAMAI}iptv.m3u8`]: { body: `#EXTM3U\n${AKAMAI}t=1/main.m3u8\n` } });

            const res = await request(app).get('/tv/secret/stream/bbc-one/index.m3u8?mode=proxy');

            expect(res.text).toBe('#EXTM3U\nt=1/main.m3u8\n');
        });

        it('streams segments from under the channel directory with their content type', async () => {
            upstream({ [`${AKAMAI}t=1/123.ts`]: { body: 'SEGMENT-BYTES', type: 'video/mp2t' } });

            const res = await request(app).get('/tv/secret/stream/bbc-one/t=1/123.ts').buffer(true);

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toBe('video/mp2t');
            expect(res.body.toString()).toBe('SEGMENT-BYTES');
        });

        it('passes an upstream error status through for sub-resources', async () => {
            upstream({ [`${AKAMAI}t=1/gone.ts`]: { status: 404 } });

            expect((await request(app).get('/tv/secret/stream/bbc-one/t=1/gone.ts')).status).toBe(404);
        });

        it('requires the key for sub-resources too', async () => {
            const fetchSpy = upstream({});

            const res = await request(app).get('/tv/wrong/stream/bbc-one/t=1/123.ts');

            expect(res.status).toBe(401);
            expect(fetchSpy).not.toHaveBeenCalled();
        });

        // The HTTP layer normalises most dot segments before routing, so exercise the handler's own guard directly
        it.each(['t=1/../../x.ts', 't=1/%2e%2e/x.ts', '%2E%2E/x.ts'])('rejects path traversal (%s)', async (path) => {
            const fetchSpy = upstream({});
            const event = makeEvent();
            event.context.params = { key: 'secret', channel: 'bbc-one', path };

            await expect(streamRoute(event)).rejects.toMatchObject({ statusCode: 400 });
            expect(fetchSpy).not.toHaveBeenCalled();
        });
    });
});
