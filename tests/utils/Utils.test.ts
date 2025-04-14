import configService from 'src/service/configService';
import { IplayarrParameter } from 'src/types/IplayarrParameters';
import { VideoType } from 'src/types/IPlayerSearchResult';
import { Synonym } from 'src/types/Synonym';
import { createNZBName } from 'src/utils/Utils'

describe('createNZBName', () => {
    describe('TV', () => {
        it('title only', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 1,
                episode: 2
            })).resolves.toBe('Thats.a.Title.S01E02.WEBDL.720p-BBC');
        });

        it('synonym replaces title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 1,
                episode: 2
            }, synonym)).resolves.toBe('Syno-Nym.Bus.S01E02.WEBDL.720p-BBC');
        });

        it('synonym override replaces title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 1,
                episode: 2
            }, synonymWithOverride)).resolves.toBe('O.Ver_Ride.2.S01E02.WEBDL.720p-BBC');
        });

        it('double digits', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 12,
                episode: 34
            })).resolves.toBe('Thats.a.Title.S12E34.WEBDL.720p-BBC');
        });

        it('yearly', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 2025,
                episode: 365
            })).resolves.toBe('Thats.a.Title.S2025E365.WEBDL.720p-BBC');
        });

        it('specials', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 0,
                episode: 0
            })).resolves.toBe('Thats.a.Title.S00E00.WEBDL.720p-BBC');
        });

        it('episode title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 1,
                episode: 2,
                episodeTitle: '14/04/2025: We Call That... an Episode.'
            })).resolves.toBe('Thats.a.Title.S01E02.14.04.2025.We.Call.That.an.Episode.WEBDL.720p-BBC');
        });

        it('quality', async () => {
            await configService.setParameter(IplayarrParameter.VIDEO_QUALITY, 'fhd');
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 1,
                episode: 2
            })).resolves.toBe('Thats.a.Title.S01E02.WEBDL.1080p-BBC');
        });

        it('missing series', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                episode: 2
            })).resolves.toBe('Thats.a.Title.S00E00.WEBDL.720p-BBC');
        });

        it('missing episode', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 1
            })).resolves.toBe('Thats.a.Title.S00E00.WEBDL.720p-BBC');
        });
    });

    describe('MOVIE', () => {
        it('title only', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.MOVIE
            })).resolves.toBe('Thats.a.Title.WEBDL.720p-BBC');
        });

        it('synonym replaces title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.MOVIE
            }, synonym)).resolves.toBe('Syno-Nym.Bus.WEBDL.720p-BBC');
        });

        it('synonym override replaces title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.MOVIE
            }, synonymWithOverride)).resolves.toBe('O.Ver_Ride.2.WEBDL.720p-BBC');
        });

        it('quality', async () => {
            await configService.setParameter(IplayarrParameter.VIDEO_QUALITY, 'fhd');
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.MOVIE
            })).resolves.toBe('Thats.a.Title.WEBDL.1080p-BBC');
        });
    });
});

afterEach(async () => {
    await configService.setParameter(IplayarrParameter.VIDEO_QUALITY, configService.defaultConfigMap[IplayarrParameter.VIDEO_QUALITY]);
})

const synonym: Synonym = {
    id: '',
    from: 'Syno-Nym Bus?',
    target: 'That\'s a Title!',
    exemptions: ''
};

const synonymWithOverride: Synonym = {
    ...synonym,
    filenameOverride: 'O.Ver_Ride: 2'
}