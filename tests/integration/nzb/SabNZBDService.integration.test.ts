/**
 * Integration tests — SabNZBDService against real SABnzbd.
 *
 * Requirements:
 *   SABNZBD_URL + SABNZBD_API_KEY env vars
 *
 * SABnzbd lives on vlan107 and is NOT reachable from the host.
 * Run via: make test integration-sabnzbd
 * (executes inside the iplayarr container where SABnzbd is reachable)
 *
 * Tests are skipped (not failed) when env vars are absent.
 */

import axios from 'axios';

import SabNZBDService from '../../../src/service/nzb/SabNZBDService';
import { App } from '../../../src/types/App';
import { AppType } from '../../../src/types/AppType';
import { integrationEnv } from '../setup.integration';

// Minimal valid NZB XML — enough for SABnzbd to accept the file
const MINIMAL_NZB = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN" "http://www.newzbin.com/DTD/nzb/nzb-1.1.dtd">
<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb">
  <head>
    <meta type="title">iPlayarr Integration Test</meta>
  </head>
  <file poster="test@iplayarr.test" date="1700000000" subject="iPlayarr Integration Test [1/1]">
    <groups><group>alt.binaries.test</group></groups>
    <segments><segment bytes="100" number="1">test-message-id@iplayarr.test</segment></segments>
  </file>
</nzb>`;

describe('SabNZBDService — SABnzbd integration', () => {
    const { sabnzbd } = integrationEnv;
    const skip = !sabnzbd.available;

    const app: App = {
        id: 'test-sabnzbd',
        url: sabnzbd.url,
        api_key: sabnzbd.apiKey,
        name: 'sabnzbd',
        type: AppType.SABNZBD,
        iplayarr: { host: '192.168.107.127', port: 4404, useSSL: false },
    } as App;

    // Track the NZB ID returned by addFile so we can delete it from the queue in afterAll.
    let addedNzoId: string | undefined;

    afterAll(async () => {
        if (skip || !addedNzoId) return;
        await axios
            .get(`${sabnzbd.url}/api`, {
                params: { mode: 'queue', name: 'delete', id: addedNzoId, apikey: sabnzbd.apiKey },
            })
            .catch(() => {/* best-effort cleanup — ignore errors */});
    });

    (skip ? test.skip : test)('testConnection — valid key returns true', async () => {
        const result = await SabNZBDService.testConnection(sabnzbd.url, { apiKey: sabnzbd.apiKey });
        expect(result).toBe(true);
    });

    (skip ? test.skip : test)('testConnection — invalid key returns non-true', async () => {
        const result = await SabNZBDService.testConnection(sabnzbd.url, { apiKey: 'invalid-key-000' });
        expect(result).not.toBe(true);
    });

    (skip ? test.skip : test)('testConnection — unreachable host returns error string', async () => {
        const result = await SabNZBDService.testConnection('http://0.0.0.0:1', { apiKey: sabnzbd.apiKey });
        expect(result).not.toBe(true);
        expect(typeof result).toBe('string');
    });

    (skip ? test.skip : test)('getAddFileUrl — builds correct URL from app', () => {
        const url = SabNZBDService.getAddFileUrl(app);
        expect(url).toContain(sabnzbd.url);
        expect(url).toContain('mode=addfile');
        expect(url).toContain('cat=iplayer');
        expect(url).toContain(`apikey=${sabnzbd.apiKey}`);
    });

    (skip ? test.skip : test)('addFile — posts NZB and receives HTTP 200', async () => {
        const file: Express.Multer.File = {
            fieldname: 'nzbfile',
            originalname: 'iplayarr-integration-test.nzb',
            encoding: '7bit',
            mimetype: 'application/x-nzb',
            buffer: Buffer.from(MINIMAL_NZB),
            size: Buffer.from(MINIMAL_NZB).length,
        } as Express.Multer.File;

        const response = await SabNZBDService.addFile(app, [file]);
        expect(response.status).toBe(200);
        // Capture the NZB ID for afterAll cleanup: SABnzbd returns { nzo_ids: [...] }
        addedNzoId = response.data?.nzo_ids?.[0] as string | undefined;
    });
});
