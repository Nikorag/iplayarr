import { defineEventHandler, setHeader } from 'h3';

import { assertLiveTvAccess } from '../../../service/liveTvAccess';
import liveTvService from '../../../service/liveTvService';

// XMLTV programme guide for Jellyfin's Live TV
export default defineEventHandler(async (event) => {
    await assertLiveTvAccess(event);

    setHeader(event, 'Content-Type', 'application/xml');
    return liveTvService.buildGuide();
});
