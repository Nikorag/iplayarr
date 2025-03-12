import { getHost } from './utils.js'

export const ipFetch = async(endpoint, method = 'GET', body) => {
    const options = {
        method,
        credentials : "include"
    }
    if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${getHost()}/${endpoint}`, options);
    return {
        data : (await response.json()),
        ok : response.ok
    }
}