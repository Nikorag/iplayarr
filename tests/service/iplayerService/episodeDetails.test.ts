import episodeCacheService from 'src/service/episodeCacheService';
import iplayerService from 'src/service/iplayerService';
import { IPlayerDetails } from 'src/types/IPlayerDetails';
import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';  
import m001kscd from 'tests/data/m001kscd';
import m001zh3r from 'tests/data/m001zh3r';
import m0026fkl from 'tests/data/m0026fkl';
import m0029c0g from 'tests/data/m0029c0g';
import p00bp2rm from 'tests/data/p00bp2rm';

describe('episodes', () => {
    it('standard series', async () => assertDetails(m0029c0g, {
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
        thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p0kzjr9f.jpg'
    }));

    it('series with roman numerals', async () => assertDetails(p00bp2rm, {
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
        thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p08vxx0m.jpg'
    }));

    it('yearly series', async () => assertDetails(m001zh3r, {
        pid: 'm001zh3r',
        title: 'RHS Chelsea Flower Show',
        episode: 15,
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
    }));
    
    it('special', async () => assertDetails(m0026fkl, {
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
        thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p0k99rdl.jpg'
    }));
});

it('movie', async () => assertDetails(m001kscd, {
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
    thumbnail: 'https://ichef.bbci.co.uk/images/ic/1920x1080/p0fbqr8s.jpg'
}));

beforeEach(() => {
    jest.clearAllMocks();
});

jest.mock('src/service/episodeCacheService');
const mockedEpisodeCacheService = jest.mocked(episodeCacheService);

const assertDetails = async (metadata: IPlayerMetadataResponse, expected: IPlayerDetails) => {
    mockedEpisodeCacheService.getMetadata.mockResolvedValueOnce(metadata);
    await expect(iplayerService.episodeDetails(metadata.programme.pid)).resolves.toEqual<IPlayerDetails>(expected);
    expect(mockedEpisodeCacheService.getMetadata).toHaveBeenCalledWith(
        metadata.programme.pid
    );
};
