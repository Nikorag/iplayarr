import axios from 'axios';

import iplayerDetailsService from '../../src/service/iplayerDetailsService';
import { IPlayerEpisodeMetadata } from '../../src/types/responses/IPlayerMetadataResponse';
import * as Utils from '../../src/utils/Utils';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../src/utils/Utils', () => ({
    calculateSeasonAndEpisode: jest.fn(),
}));

describe('iplayerDetailsService', () => {
    const mockProgramme = {
        pid: 'b1234567',
        type: 'episode',
        display_title: { title: 'Display Title' },
        title: 'Fallback Title',
        medium_synopsis: 'Synopsis text',
        ownership: { service: { title: 'BBC One' } },
        categories: [{ title: 'Drama' }],
        versions: [{ duration: 1800 }],
        first_broadcast_date: '2024-12-01',
        image: { pid: 'p09image' },
        parent: {
            programme: {
                pid: 'b7654321',
                type: 'brand',
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (Utils.calculateSeasonAndEpisode as jest.Mock).mockReturnValue(['episode', 'E1', 'Ep Title', 'S1']);
    });

    it('episodeDetails returns parsed details', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { programme: mockProgramme } });

        const result = await iplayerDetailsService.episodeDetails('b1234567');
        expect(result).toMatchObject({
            pid: 'b1234567',
            title: 'Display Title',
            episode: 'E1',
            series: 'S1',
            episodeTitle: 'Ep Title',
            type: 'episode',
            channel: 'BBC One',
            category: 'Drama',
            description: 'Synopsis text',
            runtime: 30,
            firstBroadcast: '2024-12-01',
            link: 'https://www.bbc.co.uk/programmes/b1234567',
            thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p09image.jpg',
        });
    });

    it('details returns array of episode details', async () => {
        const spy = jest.spyOn(iplayerDetailsService, 'episodeDetails').mockResolvedValueOnce({ pid: '1' } as any);
        const result = await iplayerDetailsService.details(['1']);
        expect(result).toEqual([{ pid: '1' }]);
        expect(spy).toHaveBeenCalledWith('1', expect.anything());
    });

    it('detailsForEpisodeMetadata uses release_date_time override', async () => {
        const episode: IPlayerEpisodeMetadata = {
            id: 'b1234567', release_date_time: '2024-01-01',
            type: 'episode',
            title: 'Episode Title'  
        };
        jest.spyOn(iplayerDetailsService, 'episodeDetails').mockResolvedValueOnce({ pid: 'b1234567' } as any);
        const result = await iplayerDetailsService.detailsForEpisodeMetadata([episode]);
        expect(result[0].firstBroadcast).toBe('2024-01-01');
    });

    it('getMetadata returns data from axios', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { programme: mockProgramme } });
        const result = await iplayerDetailsService.getMetadata('b1234567');
        expect(result.programme.pid).toBe('b1234567');
    });

    it('findBrandForPid returns pid when type is brand', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { programme: { pid: 'brandpid', type: 'brand' } },
        });
        const result = await iplayerDetailsService.findBrandForPid('brandpid');
        expect(result).toBe('brandpid');
    });

    it('findBrandForPid recurses to find brand', async () => {
        mockedAxios.get
            .mockResolvedValueOnce({
                data: { programme: { pid: 'childpid', type: 'episode', parent: { programme: { pid: 'parentpid' } } } },
            })
            .mockResolvedValueOnce({
                data: { programme: { pid: 'parentpid', type: 'brand' } },
            });

        const result = await iplayerDetailsService.findBrandForPid('childpid');
        expect(result).toBe('parentpid');
    });

    it('findBrandForPid returns undefined if no brand found', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { programme: { pid: 'p1', type: 'episode' } },
        });
        const result = await iplayerDetailsService.findBrandForPid('p1');
        expect(result).toBeUndefined();
    });

    it('getSeriesEpisodes returns episode list', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                programme_episodes: {
                    elements: [{ id: 'e1' }, { id: 'e2' }],
                },
            },
        });
        const result = await iplayerDetailsService.getSeriesEpisodes('b1234567');
        expect(result).toHaveLength(2);
    });

    it('getSeriesEpisodes returns [] on error', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('fail'));
        const result = await iplayerDetailsService.getSeriesEpisodes('badid');
        expect(result).toEqual([]);
    });

    it('findBrandForUrl extracts pid and resolves brand', async () => {
        const spy = jest.spyOn(iplayerDetailsService, 'findBrandForPid').mockResolvedValueOnce('b0000001');
        const result = await iplayerDetailsService.findBrandForUrl('https://www.bbc.co.uk/programmes/b0000001/episodes');
        expect(result).toBe('b0000001');
        expect(spy).toHaveBeenCalledWith('b0000001');
    });

    it('findBrandForUrl returns undefined if pid not found', async () => {
        const result = await iplayerDetailsService.findBrandForUrl('https://invalid.url/withoutpid');
        expect(result).toBeUndefined();
    });
});
