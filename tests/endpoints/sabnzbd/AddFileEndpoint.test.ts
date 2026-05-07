import { Request, Response } from 'express';

import AddFileEndpoint from '../../../src/endpoints/sabnzbd/AddFileEndpoint';
import queueService from '../../../src/service/queueService';
import { VideoType } from '../../../src/types/IPlayerSearchResult';

jest.mock('../../../src/service/queueService');
jest.mock('../../../src/service/appService');
jest.mock('../../../src/facade/nzbFacade');

function createIplayarrNzb(pid: string, nzbName: string, type: VideoType): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<nzb xmlns="http://www.newzbin.com/DTD/2003/nzb">
  <head>
    <title>${pid}</title>
    <meta type="nzbName" _="${nzbName}"/>
    <meta type="type" _="${type}"/>
  </head>
  <file poster="iplayer@bbc.com" date="1710000000" subject="${nzbName}.mp4">
    <groups><group>alt.binaries.example</group></groups>
    <segments><segment bytes="1" number="1">${pid}@news.example.com</segment></segments>
  </file>
</nzb>`;
}

describe('AddFileEndpoint', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('queues iPlayarr NZBs with the SABnzbd category from the addfile request', async () => {
        const statusMock = jest.fn().mockReturnThis();
        const jsonMock = jest.fn();
        const res = {
            status: statusMock,
            json: jsonMock,
        } as unknown as Response;

        const req = {
            query: { cat: 'tv' },
            files: [
                {
                    originalname: 'show.nzb',
                    mimetype: 'application/x-nzb',
                    buffer: Buffer.from(createIplayarrNzb('b007801x', 'Show.S01E01.Title', VideoType.TV)),
                },
            ],
        } as unknown as Request;

        await AddFileEndpoint(req, res);

        expect(queueService.addToQueue).toHaveBeenCalledWith(
            'b007801x',
            'Show.S01E01.Title',
            VideoType.TV,
            undefined,
            'tv'
        );
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ status: true, nzo_ids: ['b007801x'] });
    });

    it('preserves an empty SABnzbd category from the addfile request', async () => {
        const statusMock = jest.fn().mockReturnThis();
        const jsonMock = jest.fn();
        const res = {
            status: statusMock,
            json: jsonMock,
        } as unknown as Response;

        const req = {
            query: { cat: '' },
            files: [
                {
                    originalname: 'show.nzb',
                    mimetype: 'application/x-nzb',
                    buffer: Buffer.from(createIplayarrNzb('b007801x', 'Show.S01E01.Title', VideoType.TV)),
                },
            ],
        } as unknown as Request;

        await AddFileEndpoint(req, res);

        expect(queueService.addToQueue).toHaveBeenCalledWith(
            'b007801x',
            'Show.S01E01.Title',
            VideoType.TV,
            undefined,
            ''
        );
    });

    it('normalizes unsafe SABnzbd categories before storing them', async () => {
        const statusMock = jest.fn().mockReturnThis();
        const jsonMock = jest.fn();
        const res = {
            status: statusMock,
            json: jsonMock,
        } as unknown as Response;

        const req = {
            query: { cat: '<script>alert(1)</script>' },
            files: [
                {
                    originalname: 'show.nzb',
                    mimetype: 'application/x-nzb',
                    buffer: Buffer.from(createIplayarrNzb('b007801x', 'Show.S01E01.Title', VideoType.TV)),
                },
            ],
        } as unknown as Request;

        await AddFileEndpoint(req, res);

        expect(queueService.addToQueue).toHaveBeenCalledWith(
            'b007801x',
            'Show.S01E01.Title',
            VideoType.TV,
            undefined,
            ''
        );
    });
});
