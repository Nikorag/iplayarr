import { defineEventHandler, getQuery, getRequestURL, getRouterParam, setHeader } from 'h3';

import { assertLiveTvAccess } from '../../../service/liveTvAccess';
import liveTvService from '../../../service/liveTvService';
import { isLiveTvMode } from '../../../types/LiveTv';

// M3U playlist for Jellyfin's Live TV. `?mode=redirect|proxy` is carried through to every channel in it,
// otherwise each channel follows the configured default.
export default defineEventHandler(async (event) => {
    await assertLiveTvAccess(event);

    const { mode } = getQuery(event);
    const baseUrl = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin;

    setHeader(event, 'Content-Type', 'audio/x-mpegurl');
    return liveTvService.buildPlaylist(baseUrl, getRouterParam(event, 'key') as string, isLiveTvMode(mode) ? mode : undefined);
});
