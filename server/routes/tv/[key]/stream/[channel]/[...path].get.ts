import { createError, defineEventHandler, getQuery, getRouterParam, H3Event, sendRedirect, sendStream, setHeader } from 'h3';

import { getLiveChannel, LiveChannel } from '../../../../../constants/LiveChannels';
import { assertLiveTvAccess } from '../../../../../service/liveTvAccess';
import liveTvService from '../../../../../service/liveTvService';
import loggingService from '../../../../../service/loggingService';

const isPlaylist = (path: string) => path.split('?')[0].endsWith('.m3u8');

/** Fetches from the BBC, giving up if the client goes away */
const fetchUpstream = (event: H3Event, url: string): Promise<Response> => {
    const controller = new AbortController();
    event.node.res.on('close', () => controller.abort());
    return fetch(url, { signal: controller.signal });
};

/** Serves a playlist through iPlayarr, so that the player never needs to reach the BBC itself */
const sendPlaylist = async (event: H3Event, upstream: Response, url: string): Promise<string> => {
    setHeader(event, 'Content-Type', 'application/vnd.apple.mpegurl');
    setHeader(event, 'Cache-Control', 'no-cache');
    return liveTvService.rewritePlaylist(await upstream.text(), liveTvService.baseOf(url));
};

const proxyMaster = async (event: H3Event, channel: LiveChannel, masterUrls: string[]) => {
    for (const url of masterUrls) {
        try {
            const upstream = await fetchUpstream(event, url);
            if (upstream.ok) {
                await liveTvService.rememberProxyBase(channel, url);
                return sendPlaylist(event, upstream, url);
            }
        } catch (error: any) {
            loggingService.debug(`Live TV: ${url} failed - ${error?.message}`);
        }
    }
    throw createError({ statusCode: 502, statusMessage: `${channel.name} is not available right now` });
};

const proxyResource = async (event: H3Event, channel: LiveChannel, path: string) => {
    // Only ever fetch from underneath the channel's own CDN directory
    if (path.split('/').some((segment) => segment === '..' || decodeURIComponent(segment) === '..')) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid path' });
    }
    const url = `${await liveTvService.getProxyBase(channel)}${path}`;
    const upstream = await fetchUpstream(event, url);
    if (!upstream.ok || !upstream.body) {
        throw createError({ statusCode: upstream.ok ? 502 : upstream.status, statusMessage: 'Unavailable' });
    }
    if (isPlaylist(path)) {
        return sendPlaylist(event, upstream, url);
    }
    setHeader(event, 'Content-Type', upstream.headers.get('content-type') ?? 'application/octet-stream');
    setHeader(event, 'Cache-Control', upstream.headers.get('cache-control') ?? 'no-cache');
    return sendStream(event, upstream.body);
};

// The channel's HLS master playlist (index.m3u8) is either redirected to the BBC or proxied, depending on the mode.
// Everything below it (media playlists and segments) is only ever reached through the proxy, as the master
// playlist's relative URLs resolve against it.
export default defineEventHandler(async (event) => {
    await assertLiveTvAccess(event);

    const channel = getLiveChannel(getRouterParam(event, 'channel') ?? '');
    if (!channel) {
        throw createError({ statusCode: 404, statusMessage: 'Unknown channel' });
    }

    const path = getRouterParam(event, 'path') ?? '';
    if (path === '' || path === 'index.m3u8') {
        const masterUrls = await liveTvService.resolveStreams(channel).catch((error: any) => {
            throw createError({ statusCode: 502, statusMessage: error?.message ?? 'Stream unavailable' });
        });
        if ((await liveTvService.getMode(getQuery(event).mode)) === 'redirect') {
            return sendRedirect(event, masterUrls[0], 302);
        }
        return proxyMaster(event, channel, masterUrls);
    }
    return proxyResource(event, channel, path);
});
