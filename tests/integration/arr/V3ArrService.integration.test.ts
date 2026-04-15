/**
 * Integration tests — V3ArrService against real Sonarr and Radarr.
 *
 * Requirements:
 *   SONARR_URL + SONARR_API_KEY   env vars for Sonarr tests
 *   RADARR_URL + RADARR_API_KEY   env vars for Radarr tests
 *
 * Tests are skipped (not failed) when env vars are absent.
 * All created resources are cleaned up in afterAll.
 */

import axios from 'axios';

import V3ArrService from '../../../src/service/arr/V3ArrService';
import { App } from '../../../src/types/App';
import { AppType } from '../../../src/types/AppType';
import { CreateDownloadClientForm } from '../../../src/types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../../../src/types/requests/form/CreateIndexerForm';
import { integrationEnv, testSuffix } from '../setup.integration';

// ── helpers ──────────────────────────────────────────────────────────────────

async function deleteDownloadClient(app: App, id: number): Promise<void> {
    await axios.delete(`${app.url}/api/v3/downloadclient/${id}`, {
        headers: { 'X-Api-Key': app.api_key },
    });
}

async function deleteIndexer(app: App, id: number): Promise<void> {
    await axios.delete(`${app.url}/api/v3/indexer/${id}`, {
        headers: { 'X-Api-Key': app.api_key },
    });
}

async function deleteTag(app: App, id: number): Promise<void> {
    await axios.delete(`${app.url}/api/v3/tag/${id}`, {
        headers: { 'X-Api-Key': app.api_key },
    });
}

// ── Sonarr ────────────────────────────────────────────────────────────────────

describe('V3ArrService — Sonarr integration', () => {
    const { sonarr } = integrationEnv;
    const skip = !sonarr.available;

    // Derive iPlayarr coordinates from env so this suite is portable across stacks.
    const iplaUrlParsed = new URL(integrationEnv.iplayarr.url);
    const iplaHost = iplaUrlParsed.hostname;
    const iplaPort = Number(iplaUrlParsed.port) || (iplaUrlParsed.protocol === 'https:' ? 443 : 80);
    const iplaSSL  = iplaUrlParsed.protocol === 'https:';

    const app: App = {
        url: sonarr.url,
        api_key: sonarr.apiKey,
        type: AppType.SONARR,
        iplayarr: { host: iplaHost, port: iplaPort, useSSL: iplaSSL },
    } as any;

    const suffix = testSuffix();
    const dcName = `iplayarr-integration-test-${suffix}`;
    const idxName = `iplayarr-integration-test-${suffix}`;

    let createdDcId: number | undefined;
    let createdIdxId: number | undefined;
    let createdTagId: number | undefined;

    afterAll(async () => {
        if (skip) return;
        if (createdDcId) await deleteDownloadClient(app, createdDcId).catch(() => {});
        if (createdIdxId) await deleteIndexer(app, createdIdxId).catch(() => {});
        if (createdTagId) await deleteTag(app, createdTagId).catch(() => {});
    });

    (skip ? test.skip : test)('testConnection — valid key returns true', async () => {
        const result = await V3ArrService.testConnection(app);
        expect(result).toBe(true);
    });

    (skip ? test.skip : test)('testConnection — wrong key returns error string', async () => {
        const badApp = { ...app, api_key: 'invalid-key-00000000000000000000000000000000' };
        const result = await V3ArrService.testConnection(badApp as App);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
    });

    (skip ? test.skip : test)('getTags — returns array', async () => {
        const tags = await V3ArrService.getTags(app);
        expect(Array.isArray(tags)).toBe(true);
    });

    (skip ? test.skip : test)('createTag — creates tag and returns id + label', async () => {
        const label = `iplayarr-test-tag-${suffix}`;
        const tag = await V3ArrService.createTag(app, label);
        expect(tag).toBeDefined();
        expect(typeof tag!.id).toBe('number');
        expect(tag!.label).toBe(label);
        createdTagId = tag!.id;
    });

    (skip ? test.skip : test)('upsertDownloadClient — creates new client, returns id > 0', async () => {
        const form: CreateDownloadClientForm = {
            name: dcName,
            host: iplaHost,
            port: iplaPort,
            useSSL: iplaSSL,
            // Must be a real iPlayarr API key — Sonarr/Radarr validate the connection before creating
            apiKey: integrationEnv.iplayarr.apiKey || 'test-integration-key',
            tags: [],
        };
        const id = await V3ArrService.upsertDownloadClient(form, app, true);
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
        createdDcId = id;
    });

    (skip ? test.skip : test)('getDownloadClient — retrieves client by id', async () => {
        if (!createdDcId) {
            console.warn('[SKIP] Prerequisite upsertDownloadClient did not produce an ID — test body not executed');
            return;
        }
        const appWithDc = { ...app, download_client: { id: createdDcId, name: dcName } } as App;
        const client = await V3ArrService.getDownloadClient(appWithDc);
        expect(client).toBeDefined();
        expect(client!.id).toBe(createdDcId);
        expect(typeof client!.host).toBe('string');
        expect(typeof client!.port).toBe('number');
    });

    (skip ? test.skip : test)('upsertIndexer — creates new indexer, returns id > 0', async () => {
        if (!createdDcId) {
            console.warn('[SKIP] Prerequisite upsertDownloadClient did not produce an ID — test body not executed');
            return;
        }
        const form: CreateIndexerForm = {
            name: idxName,
            url: integrationEnv.iplayarr.url,
            urlBase: '/api',
            apiKey: integrationEnv.iplayarr.apiKey || 'test-integration-key',
            categories: [5030, 5040],
            tags: [],
            priority: 25,
            appId: 'integration-test',
            downloadClientId: createdDcId,
        };
        const id = await V3ArrService.upsertIndexer(form, app, true);
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
        createdIdxId = id;
    });

    (skip ? test.skip : test)('getIndexer — retrieves indexer by id', async () => {
        if (!createdIdxId) {
            console.warn('[SKIP] Prerequisite upsertIndexer did not produce an ID — test body not executed');
            return;
        }
        const appWithIdx = { ...app, indexer: { id: createdIdxId, name: idxName, priority: 25 } } as App;
        const indexer = await V3ArrService.getIndexer(appWithIdx);
        expect(indexer).toBeDefined();
        expect(indexer!.id).toBe(createdIdxId);
        expect(typeof indexer!.url).toBe('string');
        expect(typeof indexer!.api_key).toBe('string');
    });

    (skip ? test.skip : test)('upsertIndexer — allowCreate=false with bad id throws', async () => {
        const appWithBadIdx = { ...app, indexer: { id: 999999, name: idxName, priority: 25 } } as App;
        const form: CreateIndexerForm = {
            name: idxName,
            url: integrationEnv.iplayarr.url,
            urlBase: '/api',
            apiKey: integrationEnv.iplayarr.apiKey || 'test-integration-key',
            categories: [5030, 5040],
            tags: [],
            priority: 25,
            appId: 'integration-test',
            downloadClientId: createdDcId || 1,
        };
        await expect(V3ArrService.upsertIndexer(form, appWithBadIdx, false)).rejects.toThrow();
    });

    (skip ? test.skip : test)('search — library browse returns array', async () => {
        const results = await V3ArrService.search(app);
        expect(Array.isArray(results)).toBe(true);
    });
});

// ── Radarr ────────────────────────────────────────────────────────────────────

describe('V3ArrService — Radarr integration', () => {
    const { radarr } = integrationEnv;
    const skip = !radarr.available;

    // Derive iPlayarr coordinates from env so this suite is portable across stacks.
    const iplaUrlParsed = new URL(integrationEnv.iplayarr.url);
    const iplaHost = iplaUrlParsed.hostname;
    const iplaPort = Number(iplaUrlParsed.port) || (iplaUrlParsed.protocol === 'https:' ? 443 : 80);
    const iplaSSL  = iplaUrlParsed.protocol === 'https:';

    const app: App = {
        url: radarr.url,
        api_key: radarr.apiKey,
        type: AppType.RADARR,
        iplayarr: { host: iplaHost, port: iplaPort, useSSL: iplaSSL },
    } as any;

    const suffix = testSuffix();
    const dcName = `iplayarr-integration-test-${suffix}`;
    const idxName = `iplayarr-integration-test-${suffix}`;

    let createdDcId: number | undefined;
    let createdIdxId: number | undefined;

    afterAll(async () => {
        if (skip) return;
        if (createdDcId) await deleteDownloadClient(app, createdDcId).catch(() => {});
        if (createdIdxId) await deleteIndexer(app, createdIdxId).catch(() => {});
    });

    (skip ? test.skip : test)('testConnection — valid key returns true', async () => {
        const result = await V3ArrService.testConnection(app);
        expect(result).toBe(true);
    });

    (skip ? test.skip : test)('testConnection — wrong key returns error string', async () => {
        const badApp = { ...app, api_key: 'invalid-key-00000000000000000000000000000000' };
        const result = await V3ArrService.testConnection(badApp as App);
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
    });

    (skip ? test.skip : test)('getTags — returns array', async () => {
        const tags = await V3ArrService.getTags(app);
        expect(Array.isArray(tags)).toBe(true);
    });

    (skip ? test.skip : test)('upsertDownloadClient — creates new client, returns id > 0', async () => {
        const form: CreateDownloadClientForm = {
            name: dcName,
            host: iplaHost,
            port: iplaPort,
            useSSL: iplaSSL,
            // Must be a real iPlayarr API key — Sonarr/Radarr validate the connection before creating
            apiKey: integrationEnv.iplayarr.apiKey || 'test-integration-key',
            tags: [],
        };
        const id = await V3ArrService.upsertDownloadClient(form, app, true);
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
        createdDcId = id;
    });

    (skip ? test.skip : test)('upsertIndexer — creates new indexer, returns id > 0', async () => {
        if (!createdDcId) {
            console.warn('[SKIP] Prerequisite upsertDownloadClient did not produce an ID — test body not executed');
            return;
        }
        const form: CreateIndexerForm = {
            name: idxName,
            url: integrationEnv.iplayarr.url,
            urlBase: '/api',
            apiKey: integrationEnv.iplayarr.apiKey || 'test-integration-key',
            categories: [2010, 2020, 2030, 2040, 2045, 2050, 2060],
            tags: [],
            priority: 25,
            appId: 'integration-test',
            downloadClientId: createdDcId,
        };
        const id = await V3ArrService.upsertIndexer(form, app, true);
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
        createdIdxId = id;
    });

    (skip ? test.skip : test)('search — library browse returns array', async () => {
        const results = await V3ArrService.search(app);
        expect(Array.isArray(results)).toBe(true);
    });
});
