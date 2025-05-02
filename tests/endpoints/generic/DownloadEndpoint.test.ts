import { Request, Response } from 'express';

import DownloadEndpoint from '../../../src/endpoints/generic/DownloadEndpoint';
import iplayerDetailsService from '../../../src/service/iplayerDetailsService';
import queueService from '../../../src/service/queueService';
import { VideoType } from '../../../src/types/IPlayerSearchResult';
import { IPlayerMetadataResponse } from '../../../src/types/responses/IPlayerMetadataResponse';

jest.mock('../../../src/service/iplayerDetailsService');
jest.mock('../../../src/service/queueService');

describe('DownloadEndpoint', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        req = { query: { pid: 'abc123' } };
        res = { json: jsonMock };
    });

    it('handles TV metadata correctly and adds to queue', async () => {
        const metadata: IPlayerMetadataResponse = {
            programme: {
                display_title: { title: 'Doctor Who', subtitle: 'The Timeless Child' },
                categories: [],
                type: 'series',
                pid: '1234',
                title: 'Title'
            },
        };

        (iplayerDetailsService.getMetadata as jest.Mock).mockResolvedValue(metadata);

        await DownloadEndpoint(req as Request, res as Response);

        expect(iplayerDetailsService.getMetadata).toHaveBeenCalledWith('abc123');
        expect(queueService.addToQueue).toHaveBeenCalledWith(
            'abc123',
            'Doctor.Who_The.Timeless.Child',
            VideoType.TV
        );
        expect(jsonMock).toHaveBeenCalledWith({ status: true });
    });

    it('handles movie metadata correctly and adds to queue', async () => {
        const metadata: IPlayerMetadataResponse = {
            programme: {
                display_title: { title: 'Inception', subtitle: '' },
                categories: [{
                    type: 'format', key: 'films',
                    id: '1234',
                    title: 'Test Film',
                    broader: {
                        category: undefined
                    },
                    has_topic_page: false
                }],
                type: 'series',
                pid: '5678',
                title: 'Test Series'
            },
        };

        (iplayerDetailsService.getMetadata as jest.Mock).mockResolvedValue(metadata);

        await DownloadEndpoint(req as Request, res as Response);

        expect(queueService.addToQueue).toHaveBeenCalledWith(
            'abc123',
            'Inception',
            VideoType.MOVIE
        );
        expect(jsonMock).toHaveBeenCalledWith({ status: true });
    });

    it('handles missing metadata gracefully', async () => {
        (iplayerDetailsService.getMetadata as jest.Mock).mockResolvedValue(undefined);

        await DownloadEndpoint(req as Request, res as Response);

        expect(queueService.addToQueue).toHaveBeenCalledWith('abc123', '', VideoType.TV);
        expect(jsonMock).toHaveBeenCalledWith({ status: true });
    });
});
