import episodeCacheService from 'src/service/episodeCacheService';
import iplayerService from 'src/service/iplayerService';
import { IPlayerDetails } from 'src/types/IPlayerDetails';
import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';  
import m001kscd from 'tests/data/m001kscd';
import m0026fkl from 'tests/data/m0026fkl';
import m0029c0g from 'tests/data/m0029c0g';

describe('Beyond Paradise', () => {
    it('S03E01 Episode 1', async () => assertDetails(m0029c0g, {
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
    
    it('S00E00 Christmas Special 2024', async () => assertDetails(m0026fkl, {
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

it('Children of Men', async () => assertDetails(m001kscd, {
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

async function assertDetails(metadata: IPlayerMetadataResponse, expected: IPlayerDetails) {
    mockedEpisodeCacheService.getMetadata.mockResolvedValueOnce(metadata);
    const result = await iplayerService.episodeDetails(metadata.programme.pid);
    console.log(result);
    expect(result).toEqual(expected);
    expect(mockedEpisodeCacheService.getMetadata).toHaveBeenCalledWith(metadata.programme.pid);
}
