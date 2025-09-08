import { spawn } from 'child_process';

import { IPlayerSearchResult, VideoType } from '../../../src/service/../types/IPlayerSearchResult';
import episodeCacheService from '../../../src/service/episodeCacheService';
import getIplayerExecutableService from '../../../src/service/getIplayerExecutableService';
import loggingService from '../../../src/service/loggingService';
import getIplayerSearchService from '../../../src/service/search/GetIplayerSearchService';

// Mocks
jest.mock('child_process', () => ({
    spawn: jest.fn(),
}));

jest.mock('../../../src/service/getIplayerExecutableService');
jest.mock('../../../src/service/loggingService');
jest.mock('../../../src/service/episodeCacheService');

describe('GetIplayerSearchService', () => {
    const mockSearchParameters = jest.fn();
    const mockParseResults = jest.fn();
    const mockProcessCompletedSearch = jest.fn();
    const mockSearchEpisodeCache = jest.fn();

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        mockSearchParameters.mockResolvedValue({ exec: 'get_iplayer', args: ['--search', 'term'] });
        mockParseResults.mockResolvedValue([{ pid: 1, title: 'Test Result' }]);
        mockProcessCompletedSearch.mockResolvedValue([{ pid: 1, title: 'Test Result' }]);
        mockSearchEpisodeCache.mockResolvedValue([]);
        getIplayerExecutableService.getSearchParameters = mockSearchParameters;
        getIplayerExecutableService.parseResults = mockParseResults;
        getIplayerExecutableService.processCompletedSearch = mockProcessCompletedSearch;
        episodeCacheService.searchEpisodeCache = mockSearchEpisodeCache;
    });

    it('should successfully search and return results', async () => {
        // Setup
        const term = 'term';
        const synonym = undefined;
        const mockSpawnProcess = {
            stdout: {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback(Buffer.from('test data'));
                    }
                }),
            },
            stderr: {
                on: jest.fn(),
            },
            on: jest.fn((event, callback) => {
                if (event === 'close') {
                    callback(0); // Simulate successful exit
                }
            }),
        };

        (spawn as jest.Mock).mockReturnValue(mockSpawnProcess);

        // Act
        const results = await getIplayerSearchService.search(term, synonym);

        // Assert
        expect(results).toEqual([{ pid: 1, title: 'Test Result' }]);
        expect(mockSearchParameters).toHaveBeenCalledWith(term, synonym);
        expect(mockParseResults).toHaveBeenCalledWith(term, expect.any(Buffer), expect.any(Number));
        expect(mockProcessCompletedSearch).toHaveBeenCalledWith([{ pid: 1, title: 'Test Result' }], synonym);
        expect(loggingService.debug).toHaveBeenCalled();
    });

    it('should handle errors from the search process', async () => {
        // Setup
        const term = 'term';
        const synonym = undefined;
        const mockSpawnProcess = {
            stdout: {
                on: jest.fn(),
            },
            stderr: {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback(Buffer.from('error message'));
                    }
                }),
            },
            on: jest.fn((event, callback) => {
                if (event === 'close') {
                    callback(1); // Simulate process error exit
                }
            }),
        };

        (spawn as jest.Mock).mockReturnValue(mockSpawnProcess);

        // Act & Assert
        await expect(getIplayerSearchService.search(term, synonym)).rejects.toThrow('Process exited with code 1');
        expect(loggingService.error).toHaveBeenCalledWith('error message');
    });

    it('should add cached episodes to results', async () => {
        // Setup
        const term = 'term';
        const episodeOne : IPlayerSearchResult = {
            number: 1,
            title: 'Episode 1',
            channel: 'Channel One',
            pid: 'PID_1',
            request: {
                term: 'The Show',
                line: 'Blah'
            },
            episode: 1,
            series: 1,
            type: VideoType.TV
        }

        const episodeTwo : IPlayerSearchResult = {
            number: 1,
            title: 'Episode 2',
            channel: 'Channel One',
            pid: 'PID_2',
            request: {
                term: 'The Show',
                line: 'Blah'
            },
            episode: 2,
            series: 1,
            type: VideoType.TV
        }
        mockSearchEpisodeCache.mockResolvedValue([episodeOne]);

        // Act
        const results = await getIplayerSearchService.processCompletedSearch(
            [episodeTwo],
            term
        );

        // Assert
        expect(results).toEqual([
            episodeTwo,
            episodeOne,
        ]);
    });
});
