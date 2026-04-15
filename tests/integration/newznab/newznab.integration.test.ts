/**
 * Integration tests — iPlayarr newznab API compatibility.
 *
 * Requirements:
 *   IPLAYARR_URL       (default: http://192.168.107.127:4404)
 *   IPLAYARR_API_KEY   env var — find in iPlayarr → Settings → API Key
 *
 * Tests the /api endpoint that NZBHydra2, Sonarr, and Radarr use to
 * search iPlayarr as a newznab indexer.
 *
 * Tests are skipped (not failed) when IPLAYARR_API_KEY is absent.
 *
 * NZBHydra2 caps smoke check requires NZBHYDRA2_API_KEY.
 */

import axios from 'axios';

import { integrationEnv } from '../setup.integration';

describe('iPlayarr newznab API — compatibility', () => {
    const { iplayarr } = integrationEnv;
    const skipKey = !iplayarr.available;

    // /ping is always unauthenticated — runs regardless of API key
    test('GET /ping — returns 200 status OK', async () => {
        const res = await axios.get(`${iplayarr.url}/ping`);
        expect(res.status).toBe(200);
        expect(res.data).toEqual({ status: 'OK' });
    });

    (skipKey ? test.skip : test)('GET /api?t=caps — valid key returns 200 XML with <caps>', async () => {
        const res = await axios.get(`${iplayarr.url}/api`, {
            params: { t: 'caps', apikey: iplayarr.apiKey },
            responseType: 'text',
        });
        expect(res.status).toBe(200);
        expect(res.data).toContain('<caps');
        expect(res.data).toContain('<categories');
    });

    test('GET /api?t=caps — no apikey returns 401', async () => {
        await expect(
            axios.get(`${iplayarr.url}/api`, { params: { t: 'caps' } })
        ).rejects.toMatchObject({ response: { status: 401 } });
    });

    test('GET /api?t=caps — wrong apikey returns 401', async () => {
        await expect(
            axios.get(`${iplayarr.url}/api`, { params: { t: 'caps', apikey: 'wrong-key-000' } })
        ).rejects.toMatchObject({ response: { status: 401 } });
    });

    (skipKey ? test.skip : test)('GET /api?t=search — returns 200 newznab RSS feed', async () => {
        const res = await axios.get(`${iplayarr.url}/api`, {
            params: { t: 'search', q: 'doctor who', apikey: iplayarr.apiKey },
            responseType: 'text',
        });
        expect(res.status).toBe(200);
        expect(res.data).toContain('<rss');
        expect(res.data).toContain('<channel');
    });

    (skipKey ? test.skip : test)('GET /api?t=tvsearch — returns 200 newznab RSS feed', async () => {
        const res = await axios.get(`${iplayarr.url}/api`, {
            params: { t: 'tvsearch', q: 'blue peter', apikey: iplayarr.apiKey },
            responseType: 'text',
        });
        expect(res.status).toBe(200);
        expect(res.data).toContain('<rss');
        expect(res.data).toContain('<channel');
    });

    // Fixed: empty query now returns the schedule RSS feed (q || '*' fallback).
    (skipKey ? test.skip : test)('GET /api?t=search — empty query returns RSS schedule feed', async () => {
        const res = await axios.get(`${iplayarr.url}/api`, {
            params: { t: 'search', q: '', apikey: iplayarr.apiKey },
            responseType: 'text',
        });
        expect(res.status).toBe(200);
        expect(res.data).toContain('<rss');
        expect(res.data).toContain('<channel');
    });

    (skipKey ? test.skip : test)('GET /api?t=unknown — returns 404 JSON error', async () => {
        await expect(
            axios.get(`${iplayarr.url}/api`, {
                params: { t: 'nonexistent', apikey: iplayarr.apiKey },
            })
        ).rejects.toMatchObject({ response: { status: 404 } });
    });
});

describe('NZBHydra2 newznab API — caps smoke check', () => {
    const { nzbhydra2 } = integrationEnv;
    const skipKey = !nzbhydra2.available;

    (skipKey ? test.skip : test)('GET /api?t=caps — returns 200 XML with <caps>', async () => {
        const res = await axios.get(`${nzbhydra2.url}/api`, {
            params: { t: 'caps', apikey: nzbhydra2.apiKey },
            responseType: 'text',
        });
        expect(res.status).toBe(200);
        expect(res.data).toContain('<caps');
        expect(res.data).toContain('<server');
    });

    (skipKey ? test.skip : test)('GET /api?t=search — returns 200 RSS feed', async () => {
        const res = await axios.get(`${nzbhydra2.url}/api`, {
            params: { t: 'search', q: 'test', apikey: nzbhydra2.apiKey },
            responseType: 'text',
        });
        expect(res.status).toBe(200);
        expect(res.data).toContain('<rss');
    });
});
