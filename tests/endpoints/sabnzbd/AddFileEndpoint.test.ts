import request from 'supertest';

import AddFileEndpoint from '../../../server/endpoints/sabnzbd/AddFileEndpoint';
import nzbFacade from '../../../server/facade/nzbFacade';
import appService from '../../../server/service/appService';
import queueService from '../../../server/service/queueService';
import { AppType } from '../../../server/types/AppType';
import { nodeApp } from '../../helpers/h3';

jest.mock('../../../server/facade/nzbFacade');
jest.mock('../../../server/service/appService');
jest.mock('../../../server/service/queueService');

const app = nodeApp([['post', '/', AddFileEndpoint]]);

const iplayarrNzb = `<?xml version="1.0" encoding="UTF-8"?>
<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb">
  <head>
    <title>m001abcd</title>
    <meta type="nzbName" _="Test.Show"/>
    <meta type="type" _="tv"/>
    <meta type="app" _="app1"/>
  </head>
</nzb>`;

const realNzb = `<?xml version="1.0" encoding="UTF-8"?>
<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb"><head><meta type="name">Some.Usenet.Release</meta></head></nzb>`;

describe('AddFileEndpoint', () => {
    it('queues an iPlayarr NZB uploaded as multipart form data', async () => {
        const res = await request(app).post('/').attach('name', Buffer.from(iplayarrNzb), 'Test.Show.nzb');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: true, nzo_ids: ['m001abcd'] });
        expect(queueService.addToQueue).toHaveBeenCalledWith('m001abcd', 'Test.Show', 'tv', 'app1');
    });

    it('forwards a real NZB to the first working NZB app, passing the upload through', async () => {
        (appService.getAllApps as jest.Mock).mockResolvedValue([
            { type: AppType.SABNZBD, priority: 2, url: 'http://b', name: 'b' },
            { type: AppType.RADARR, priority: 0, url: 'http://r', name: 'r' },
            { type: AppType.NZBGET, priority: 1, url: 'http://a', name: 'a' },
        ]);
        (nzbFacade.testConnection as jest.Mock).mockResolvedValue(true);
        (nzbFacade.addFile as jest.Mock).mockResolvedValue({ status: 200, data: { status: true } });

        const res = await request(app).post('/').attach('name', Buffer.from(realNzb), 'Real.Release.nzb');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: true });
        expect(queueService.addToQueue).not.toHaveBeenCalled();

        const [forwardedApp, files, nzbName] = (nzbFacade.addFile as jest.Mock).mock.calls[0];
        expect(forwardedApp.url).toBe('http://a');
        expect(nzbName).toBe('Some.Usenet.Release');
        expect(files).toHaveLength(1);
        expect(files[0].originalname).toBe('Real.Release.nzb');
        expect(files[0].buffer.toString()).toBe(realNzb);
    });

    it('returns a 500 when a real NZB cannot be forwarded anywhere', async () => {
        (appService.getAllApps as jest.Mock).mockResolvedValue([]);

        const res = await request(app).post('/').attach('name', Buffer.from(realNzb), 'Real.Release.nzb');

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ status: false, error: 'Invalid iPlayarr NZB File' });
    });
});
