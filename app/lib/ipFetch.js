import { getHost } from './utils.js';

export const ipFetch = async (endpoint, method = 'GET', body) => {
    const options = {
        method,
        credentials: 'include',
    };
    if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${getHost()}/${endpoint}`, options);
    let data;
    try {
        data = await response.json();
    } catch {
        // Non-JSON body, for example a proxy error page
        data = { message: `${response.status} ${response.statusText}`.trim() };
    }
    return {
        data,
        ok: response.ok,
    };
};
