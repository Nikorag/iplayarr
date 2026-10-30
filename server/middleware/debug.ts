import { defineEventHandler, getRequestHeader, getRequestHeaders, readBody } from 'h3';

import loggingService from '../service/loggingService';

const parsedContentTypes = ['application/json', 'application/x-www-form-urlencoded'];

export default defineEventHandler(async (event) => {
    loggingService.debug('Request received:');
    loggingService.debug('Method:', event.method);
    loggingService.debug('URL:', event.path);
    loggingService.debug('Headers:', getRequestHeaders(event));
    const contentType = getRequestHeader(event, 'content-type') ?? '';
    if (parsedContentTypes.some((type) => contentType.startsWith(type))) {
        loggingService.debug('Body:', await readBody(event).catch(() => undefined));
    }
});
