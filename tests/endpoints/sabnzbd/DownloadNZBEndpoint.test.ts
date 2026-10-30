import DownloadNZBEndpoint from '../../../server/endpoints/sabnzbd/DownloadNZBEndpoint';
import { VideoType } from '../../../server/types/IPlayerSearchResult'; // Adjust the path as needed
import { makeEvent, responseHeader } from '../../helpers/h3';

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
        const event = makeEvent({
            query: {
                pid: '12345',
                nzbName: 'sample-nzb',
                type: VideoType.TV,
                app: 'testApp',
            },
        });

        const body = await DownloadNZBEndpoint(event);

        expect(responseHeader(event, 'content-type')).toBe('application/x-nzb');
        expect(body).toEqual(expect.stringContaining('<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN"'));
        expect(body).toEqual(expect.stringContaining('<nzb>mocked xml content</nzb>'));
    });
});
