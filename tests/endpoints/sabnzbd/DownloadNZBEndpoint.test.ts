import { Request, Response } from 'express';

import DownloadNZBEndpoint from '../../../src/endpoints/sabnzbd/DownloadNZBEndpoint';
import { VideoType } from '../../../src/types/IPlayerSearchResult'; // Adjust the path as needed

jest.mock('xml2js', () => {
    return {
        Builder: jest.fn().mockImplementation(() => {
            return {
                buildObject: jest.fn().mockReturnValue('<nzb>mocked xml content</nzb>'),
            };
        }),
    };
});

describe('DownloadNZBEndpoint', () => {
    it('responds with the correct NZB file', async () => {
        const sendMock = jest.fn();
        const setMock = jest.fn();
        const res = {
            set: setMock,
            send: sendMock,
        } as unknown as Response;

        const req = {
            query: {
                pid: '12345',
                nzbName: 'sample-nzb',
                type: VideoType.TV,
                app: 'testApp',
            },
        } as unknown as Request;

        await DownloadNZBEndpoint(req, res);

        expect(setMock).toHaveBeenCalledWith('Content-Type', 'application/x-nzb');
        expect(sendMock).toHaveBeenCalledWith(
            expect.stringContaining('<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN"')
        );
        expect(sendMock).toHaveBeenCalledWith(
            expect.stringContaining('<nzb>mocked xml content</nzb>')
        );
    });
});
