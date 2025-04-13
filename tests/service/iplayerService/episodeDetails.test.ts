import episodeCacheService from 'src/service/episodeCacheService';
import iplayerService from 'src/service/iplayerService';
import { IPlayerDetails } from 'src/types/IPlayerDetails';
import { VideoType } from 'src/types/IPlayerSearchResult';
import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';  
import b008m7xk from 'tests/data/b008m7xk';
import b0211hsl from 'tests/data/b0211hsl';
import m000jbtq from 'tests/data/m000jbtq';
import m001kscd from 'tests/data/m001kscd';
import m001zh3r from 'tests/data/m001zh3r';
import m001zh50 from 'tests/data/m001zh50';
import m0026fkl from 'tests/data/m0026fkl';
import m0029c0g from 'tests/data/m0029c0g';
import p00bp2rm from 'tests/data/p00bp2rm';
import p0fq3s31 from 'tests/data/p0fq3s31';

describe('episodes', () => {
    it('series episode', async () => assertDetails(m0029c0g, {
        pid: 'm0029c0g',
        title: 'Beyond Paradise',
        episode: 1,
        episodeTitle: 'Episode 1',
        series: 3,
        channel: 'BBC One',
        category: 'Crime',
        description: 'When a body is found in the river on the county border, Humphrey and Esther are brought face to face with their Cornish counterparts.',
        runtime: 57,
        firstBroadcast: '2025-03-28T20:00:00Z',
        link: 'https://www.bbc.co.uk/programmes/m0029c0g',
        thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p0kzjr9f.jpg',
        type: VideoType.TV
    }));

    it('roman numerals series', async () => assertDetails(p00bp2rm, {
        pid: 'p00bp2rm',
        title: 'Red Dwarf',
        episode: 5,
        episodeTitle: 'Dimension Jump',
        series: 4,
        channel: 'BBC Two',
        category: 'Sitcoms',
        description: 'In a parallel universe, another Arnold Rimmer exists, but he\'s charming, popular, brave and modest. After his craft breaks the speed of reality, he meets his counterpart.',
        runtime: 30,
        firstBroadcast: '1991-03-14T21:00:00Z',
        link: 'https://www.bbc.co.uk/programmes/p00bp2rm',
        thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p08vxx0m.jpg',
        type: VideoType.TV
    }));

    it('yearly series', async () => assertDetails(m001zh50, {
        pid: 'm001zh50',
        title: 'RHS Chelsea Flower Show',
        episode: 1,
        episodeTitle: 'Episode 1',
        series: 2024,
        channel: 'BBC Two',
        category: 'Gardens',
        description:
        'Nicki Chapman and Angellica Bell have exclusive access to the glitz and glamour of opening day of the RHS Chelsea Flower Show 2024.',
        runtime: 44,
        firstBroadcast: '2024-05-20T15:45:00+01:00',
        link: 'https://www.bbc.co.uk/programmes/m001zh50',
        thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p0hz4zsw.jpg',
        type: VideoType.TV
    }));

    describe('specials', () => {
        it('with no series', async () => assertDetails(m0026fkl, {
            pid: 'm0026fkl',
            title: 'Beyond Paradise',
            episode: 0,
            episodeTitle: 'Christmas Special 2024',
            series: 0,
            channel: 'BBC One',
            category: 'Crime',
            description: 'When a widower starts seeing the ghost of his late wife, DS Esther Williams is deeply sceptical, but DI Humphrey Goodman is more than happy to dive into his first haunting.',
            runtime: 57,
            firstBroadcast: '2024-12-27T21:00:00Z',
            link: 'https://www.bbc.co.uk/programmes/m0026fkl',
            thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p0k99rdl.jpg',
            type: VideoType.TV
        }));

        it('in numbered series', async () => assertDetails(p0fq3s31, {
            pid: 'p0fq3s31',
            title: 'Red Dwarf',
            episode: 0,
            episodeTitle: 'The Promised Land',
            series: 13,
            channel: 'BBC Two',
            category: 'Sitcoms',
            description: 'The posse meet three cat clerics who worship Lister. They\'re being hunted by Rodon, the feral cat leader who wants to wipe out cats who worship anyone but him.',
            runtime: 89,
            firstBroadcast: undefined,
            link: 'https://www.bbc.co.uk/programmes/p0fq3s31',
            thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p0fwp8mb.jpg',
            type: VideoType.TV
        }));

        it('episode before series', async () => assertDetails(m001zh3r, {
            pid: 'm001zh3r',
            title: 'RHS Chelsea Flower Show',
            episode: 0,
            episodeTitle: 'RHS: Countdown to Chelsea',
            series: 2024,
            channel: 'BBC Two',
            category: 'Gardens',
            description:
        'Join Sophie Raworth and Joe Swift for an exclusive first look at the Royal Horticultural Society’s Chelsea Flower Show 2024.',
            runtime: 59,
            firstBroadcast: '2024-05-19T18:15:00+01:00',
            link: 'https://www.bbc.co.uk/programmes/m001zh3r',
            thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p0hz5bjs.jpg',
            type: VideoType.TV
        }));
    
        it('episode after series', async () => assertDetails(b0211hsl, {
            pid: 'b0211hsl',
            title: 'RHS Chelsea Flower Show',
            episode: 0,
            episodeTitle: 'Red Button Special',
            series: 0,
            channel: 'BBC Two',
            category: 'Gardens',
            description:
        'Professor Nigel Dunnett explains his rooftop garden which celebrates \'skyrise greening\' and looks at water management in a wonderful living, outside/inside spatial experience.',
            runtime: 20,
            firstBroadcast: '2013-05-25T12:00:00+01:00',
            link: 'https://www.bbc.co.uk/programmes/b0211hsl',
            thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p01l9ftp.jpg',
            type: VideoType.TV
        }));

        it('from series of specials', async () => assertDetails(m000jbtq, {
            pid: 'm000jbtq',
            title: 'RHS Chelsea Flower Show',
            episode: 0,
            episodeTitle: 'Your Chelsea Flower Show, Making the Most of Your Time',
            series: 0,
            channel: 'BBC Two',
            category: 'Gardens',
            description:
        'Nicki Chapman and the team help you make the most of your time in your own garden, including ideas for low-maintenance lawns.',
            runtime: 44,
            firstBroadcast: '2020-05-22T15:45:00+01:00',
            link: 'https://www.bbc.co.uk/programmes/m000jbtq',
            thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p08d4pr0.jpg',
            type: VideoType.TV
        }));
    });
});

describe('movies', () => {
    it('standalone', async () => assertDetails(m001kscd, {
        pid: 'm001kscd',
        title: 'Children of Men',
        episode: undefined,
        episodeTitle: undefined,
        series: undefined,
        channel: 'BBC Two',
        category: 'Drama',
        description: 'In a chaotic future Britain where no child has been born for years, a loner helps the world\'s only known pregnant woman to safety.',
        runtime: 98,
        firstBroadcast: '2023-04-02T22:00:00+01:00',
        link: 'https://www.bbc.co.uk/programmes/m001kscd',
        thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p0fbqr8s.jpg',
        type: VideoType.MOVIE
    }));

    it('sequel', async () => assertDetails(b008m7xk, {
        pid: 'b008m7xk',
        title: 'Shrek 2',
        episode: undefined,
        episodeTitle: undefined,
        series: undefined,
        channel: 'BBC One',
        category: 'Animation',
        description: 'Animated sequel following the grumpy ogre (voiced by Mike Myers) and his bride as they head off to meet her parents. The occasion is marred by the wicked Fairy Godmother.',
        runtime: 85,
        firstBroadcast: '2007-12-25T16:40:00Z',
        link: 'https://www.bbc.co.uk/programmes/b008m7xk',
        thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p07xpnby.jpg',
        type: VideoType.MOVIE
    }));
});

jest.mock('src/service/episodeCacheService');
const mockedEpisodeCacheService = jest.mocked(episodeCacheService);

const assertDetails = async (metadata: IPlayerMetadataResponse, expected: IPlayerDetails) => {
    mockedEpisodeCacheService.getMetadata.mockResolvedValueOnce(metadata);
    await expect(iplayerService.episodeDetails(metadata.programme.pid)).resolves.toEqual<IPlayerDetails>(expected);
    expect(mockedEpisodeCacheService.getMetadata).toHaveBeenCalledWith(metadata.programme.pid);
}
