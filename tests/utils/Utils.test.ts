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
            })).resolves.toBe('Thats.a.Title.S01E02.WEB.720p.H.264.BBC');
        });

        it('synonym replaces title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 1,
                episode: 2
            }, synonym)).resolves.toBe('Syno-Nym.Bus.S01E02.WEB.720p.H.264.BBC');
        });

        it('synonym override replaces title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 1,
                episode: 2
            }, synonymWithOverride)).resolves.toBe('O.Ver_Ride.2.S01E02.WEB.720p.H.264.BBC');
        });

        it('double digits', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 12,
                episode: 34
            })).resolves.toBe('Thats.a.Title.S12E34.WEB.720p.H.264.BBC');
        });

        it('yearly', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 2025,
                episode: 365
            })).resolves.toBe('Thats.a.Title.S2025E365.WEB.720p.H.264.BBC');
        });

        it('specials', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 0,
                episode: 0
            })).resolves.toBe('Thats.a.Title.S00E00.WEB.720p.H.264.BBC');
        });

        it('episode title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.TV,
                series: 1,
                episode: 2,
                episodeTitle: 'We Call That... an Episode'
            })).resolves.toBe('Thats.a.Title.S01E02.We.Call.That.an.Episode.WEB.720p.H.264.BBC');
        });
    });

    describe('MOVIE', () => {
        it('title only', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.MOVIE
            })).resolves.toBe('Thats.a.Title.BBC.WEB-DL.AAC.2.0.720p.H.264');
        });

        it('synonym replaces title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.MOVIE
            }, synonym)).resolves.toBe('Syno-Nym.Bus.BBC.WEB-DL.AAC.2.0.720p.H.264');
        });

        it('synonym override replaces title', async () => {
            await expect(createNZBName({
                title: synonym.target,
                pid: '',
                type: VideoType.MOVIE
            }, synonymWithOverride)).resolves.toBe('O.Ver_Ride.2.BBC.WEB-DL.AAC.2.0.720p.H.264');
        });
    });
});

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