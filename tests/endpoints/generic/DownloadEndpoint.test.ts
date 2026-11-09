import DownloadEndpoint from '../../../server/endpoints/generic/DownloadEndpoint';
import iplayerDetailsService from '../../../server/service/iplayerDetailsService';
import queueService from '../../../server/service/queueService';
import { VideoType } from '../../../server/types/IPlayerSearchResult';
import { IPlayerMetadataResponse } from '../../../server/types/responses/IPlayerMetadataResponse';
import { makeEvent } from '../../helpers/h3';

jest.mock('../../../server/service/iplayerDetailsService');
jest.mock('../../../server/service/queueService');

describe('DownloadEndpoint', () => {
    const event = () => makeEvent({ query: { pid: 'abc123' } });

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

        const result = await DownloadEndpoint(event());

        expect(iplayerDetailsService.getMetadata).toHaveBeenCalledWith('abc123');
        expect(queueService.addToQueue).toHaveBeenCalledWith(
            'abc123',
            'Doctor.Who_The.Timeless.Child',
            VideoType.TV
        );
        expect(result).toEqual({ status: true });
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

        const result = await DownloadEndpoint(event());

        expect(queueService.addToQueue).toHaveBeenCalledWith(
            'abc123',
            'Inception',
            VideoType.MOVIE
        );
        expect(result).toEqual({ status: true });
    });

    it('handles missing metadata gracefully', async () => {
        (iplayerDetailsService.getMetadata as jest.Mock).mockResolvedValue(undefined);

        const result = await DownloadEndpoint(event());

        expect(queueService.addToQueue).toHaveBeenCalledWith('abc123', '', VideoType.TV);
        expect(result).toEqual({ status: true });
    });
});
