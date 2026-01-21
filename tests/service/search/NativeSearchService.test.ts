import axios from 'axios';

import { searchResultLimit } from '../../../src/constants/iPlayarrConstants';
import iplayerDetailsService from '../../../src/service/iplayerDetailsService';
import NativeSearchService from '../../../src/service/search/NativeSearchService';
import { IPlayerSearchResult, VideoType } from '../../../src/types/IPlayerSearchResult';
import { IPlayerEpisodeMetadata } from '../../../src/types/responses/IPlayerMetadataResponse';
import { Synonym } from '../../../src/types/Synonym';
import { createNZBName, getQualityProfile } from '../../../src/utils/Utils';

jest.mock('axios');
jest.mock('../../../src/service//episodeCacheService');
jest.mock('../../../src/service//iplayerDetailsService');
jest.mock('../../../src/utils/Utils', () => ({
    ...jest.requireActual('../../../src/utils/Utils'),
    createNZBName: jest.fn(),
    getQualityProfile: jest.fn(),
}));

describe('NativeSearchService', () => {
    let mockSynonym: any;
    let mockSizeFactor: number;
    let mockTerm: string;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSynonym = { synonymKey: 'synonymValue' };
        mockTerm = 'Test Term';
        mockSizeFactor = 1;

        (getQualityProfile as jest.Mock).mockResolvedValue({ sizeFactor: mockSizeFactor });
        (createNZBName as jest.Mock).mockResolvedValue('testNZBName');
    });

    describe('search', () => {
        it('should return search results with valid data', async () => {
            const episodesResponse: IPlayerEpisodeMetadata[] = [
                {
                    type: 'series',
                    id: 'series1234',
                    title: 'Series Title',
                },
                {
                    type: 'episode',
                    id: 'ep1234',
                    title: 'Episode Title',
                    release_date_time: '1990-01-13'
                }
            ];

            (axios.get as jest.Mock).mockResolvedValueOnce({
                status: 200,
                data: {
                    new_search: {
                        results: [{ id: 'testId', title: 'Test' }],
                    },
                }
            });

            (iplayerDetailsService.getSeriesEpisodes as jest.Mock).mockResolvedValue(episodesResponse);
            (iplayerDetailsService.findBrandForPid as jest.Mock).mockResolvedValue('testBrandPid');
            (iplayerDetailsService.detailsForEpisodeMetadata as jest.Mock).mockResolvedValue([
                { title: 'Test Title', pid: 'testPid', type: 'episode', firstBroadcast: '2025-01-01', runtime: 60 }
            ]);

            const results = await NativeSearchService.search(mockTerm, mockSynonym);

            expect(results).toHaveLength(1); // Expect the result with a release date to be returned
            expect(results[0]).toHaveProperty('title', 'Test Title');
            expect(results[0]).toHaveProperty('pid', 'testPid');
            expect(results[0]).toHaveProperty('nzbName', 'testNZBName');
        });

        it('should return an empty array when the response status is not 200', async () => {
            (axios.get as jest.Mock).mockResolvedValue({
                status: 500,
                data: {},
            });

            const results = await NativeSearchService.search(mockTerm);

            expect(results).toHaveLength(0); // Should return empty array on failure
        });

        it('should handle the case when there are no results', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({
                status: 200,
                data: { new_search: { results: [] } },
            });

            const results = await NativeSearchService.search(mockTerm);

            expect(results).toHaveLength(0); // Should return empty array when no results
        });

        it('should handle episodes without a brand PID', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({
                status: 200,
                data: {
                    new_search: {
                        results: [
                            { id: 'episodeId1', title: 'Test Term' },
                            { id: 'episodeId2', title: 'Test Term' }
                        ],
                    },
                }
            });

            (iplayerDetailsService.findBrandForPid as jest.Mock).mockResolvedValue(null);
            (iplayerDetailsService.details as jest.Mock)
                .mockResolvedValueOnce([
                    { title: 'Episode With Date', pid: 'episodeId1', type: 'episode', firstBroadcast: '2025-01-01', runtime: 30 }
                ])
                .mockResolvedValueOnce([
                    { title: 'Episode Without Date', pid: 'episodeId2', type: 'episode', runtime: 30 }
                ]);

            const results = await NativeSearchService.search(mockTerm);

            expect(results).toHaveLength(2); // Should return two results
            expect(results[0]).toHaveProperty('title', 'Episode With Date');
            expect(results[0]).toHaveProperty('pid', 'episodeId1');
            expect(results[0].pubDate).toEqual(new Date('2025-01-01'));
            expect(results[0].size).toBe(1800);
            expect(results[1]).toHaveProperty('title', 'Episode Without Date');
            expect(results[1]).toHaveProperty('pid', 'episodeId2');
            expect(results[1].pubDate).toBeUndefined();
            expect(results[1].size).toBe(1800);
            expect(iplayerDetailsService.details).toHaveBeenCalledTimes(2);
        });

        it('should not fetch duplicate brands', async () => {
            (axios.get as jest.Mock).mockResolvedValueOnce({
                status: 200,
                data: {
                    new_search: {
                        results: [
                            { id: 'episode1', title: 'Test Term Episode 1' },
                            { id: 'episode2', title: 'Test Term Episode 2' },
                            { id: 'episode3', title: 'Test Term Episode 3' }
                        ],
                    },
                }
            });

            (iplayerDetailsService.findBrandForPid as jest.Mock).mockResolvedValue('sameBrandPid');
            (iplayerDetailsService.getSeriesEpisodes as jest.Mock).mockResolvedValue([
                { type: 'episode', id: 'ep1', title: 'Episode 1', release_date_time: '2025-01-01' },
                { type: 'episode', id: 'ep2', title: 'Episode 2', release_date_time: '2025-01-02' }
            ]);
            (iplayerDetailsService.detailsForEpisodeMetadata as jest.Mock).mockResolvedValue([
                { title: 'Episode With Runtime', pid: 'ep1', type: 'episode', firstBroadcast: '2025-01-01', runtime: 30 },
                { title: 'Episode Without Runtime', pid: 'ep2', type: 'episode', firstBroadcast: '2025-01-02' }
            ]);

            const results = await NativeSearchService.search(mockTerm);

            expect(iplayerDetailsService.getSeriesEpisodes).toHaveBeenCalledTimes(1);
            expect(iplayerDetailsService.getSeriesEpisodes).toHaveBeenCalledWith('sameBrandPid');
            expect(results).toHaveLength(2); // Should return two results from the same brand
            expect(results[0].size).toBe(1800);
            expect(results[1].size).toBeUndefined();
        });

        it('should process episodes in chunks when count exceeds chunk size', async () => {
            const manyEpisodes: IPlayerEpisodeMetadata[] = Array.from({ length: 12 }, (_, i) => ({
                type: 'episode',
                id: `ep${i}`,
                title: `Episode ${i}`,
                release_date_time: '2025-01-01'
            }));

            (axios.get as jest.Mock).mockResolvedValueOnce({
                status: 200,
                data: {
                    new_search: {
                        results: [{ id: 'brandId', title: 'Test Brand' }],
                    },
                }
            });

            (iplayerDetailsService.findBrandForPid as jest.Mock).mockResolvedValue('testBrandPid');
            (iplayerDetailsService.getSeriesEpisodes as jest.Mock).mockResolvedValue(manyEpisodes);
            (iplayerDetailsService.detailsForEpisodeMetadata as jest.Mock).mockImplementation(
                (episodes: IPlayerEpisodeMetadata[]) => Promise.resolve(
                    episodes.map(ep => ({
                        title: ep.title,
                        pid: ep.id,
                        type: 'episode',
                        firstBroadcast: '2025-01-01',
                        runtime: 30
                    }))
                )
            );

            const results = await NativeSearchService.search(mockTerm);

            expect(iplayerDetailsService.detailsForEpisodeMetadata).toHaveBeenCalledTimes(3);
            expect(results).toHaveLength(12);
        });

        it('should limit results to searchResultLimit', async () => {
            const episodesPerBrand: IPlayerEpisodeMetadata[] = Array.from({ length: searchResultLimit + 10 }, (_, i) => ({
                type: 'episode',
                id: `ep${i}`,
                title: `Episode ${i}`,
                release_date_time: '2025-01-01'
            }));

            (axios.get as jest.Mock).mockResolvedValueOnce({
                status: 200,
                data: {
                    new_search: {
                        results: [
                            { id: 'brand1', title: 'Test Brand 1' },
                            { id: 'brand2', title: 'Test Brand 2' }
                        ],
                    },
                }
            });

            (iplayerDetailsService.findBrandForPid as jest.Mock)
                .mockResolvedValueOnce('brandPid1')
                .mockResolvedValueOnce('brandPid2');
            (iplayerDetailsService.getSeriesEpisodes as jest.Mock).mockResolvedValue(episodesPerBrand);
            (iplayerDetailsService.detailsForEpisodeMetadata as jest.Mock).mockImplementation(
                (episodes: IPlayerEpisodeMetadata[]) => Promise.resolve(
                    episodes.map(ep => ({
                        title: ep.title,
                        pid: ep.id,
                        type: 'episode',
                        firstBroadcast: '2025-01-01',
                        runtime: 30
                    }))
                )
            );

            const results = await NativeSearchService.search(mockTerm);

            expect(results.length).toBeGreaterThan(searchResultLimit); // First brand exceeds limit
            expect(iplayerDetailsService.getSeriesEpisodes).toHaveBeenCalledTimes(1); // Should not process second brand
        });
    });

    describe('processCompletedSearch', () => {
        it('should return the results unmodified', async () => {
            const mockResults: IPlayerSearchResult[] = [{
                title: 'Test Title', pid: 'testPid',
                number: 1,
                channel: 'Channel 1',
                request: {
                    term: 'term',
                    line: 'line'
                },
                type: VideoType.TV
            }];
            const results = await NativeSearchService.processCompletedSearch(mockResults, mockTerm);

            expect(results).toEqual(mockResults); // Should return the results as they are
        });

        it('should not filter out programmes if synonym has no exemptions', async () => {
            const mockResults: IPlayerSearchResult[] = [{
                title: 'Test Title', pid: 'includePid',
                number: 1,
                channel: 'Channel 1',
                request: {
                    term: 'term',
                    line: 'line'
                },
                type: VideoType.TV
            }, {
                title: 'Exempt1 Title', pid: 'exempt1Pid',
                number: 2,
                channel: 'Channel 1',
                request: {
                    term: 'term',
                    line: 'line'
                },
                type: VideoType.TV
            }, {
                title: 'Exempt2 Title', pid: 'exempt2Pid',
                number: 3,
                channel: 'Channel 1',
                request: {
                    term: 'term',
                    line: 'line'
                },
                type: VideoType.TV
            }];

            const mockSynonym: Synonym = {
                exemptions: '',
                id: 'synonym-1',
                from: 'Title 2025',
                target: 'Title',
            };

            const results = await NativeSearchService.processCompletedSearch(mockResults, mockTerm, mockSynonym);

            expect(results).toEqual(mockResults); // Should return all entries as no exemptions matched
        });

        it('should filter out programmes that match synonym exemptions', async () => {
            const mockResults: IPlayerSearchResult[] = [{
                title: 'Test Title', pid: 'includePid',
                number: 1,
                channel: 'Channel 1',
                request: {
                    term: 'term',
                    line: 'line'
                },
                type: VideoType.TV
            }, {
                title: 'Exempt1 Title', pid: 'exempt1Pid',
                number: 2,
                channel: 'Channel 1',
                request: {
                    term: 'term',
                    line: 'line'
                },
                type: VideoType.TV
            }, {
                title: 'Exempt2 Title', pid: 'exempt2Pid',
                number: 3,
                channel: 'Channel 1',
                request: {
                    term: 'term',
                    line: 'line'
                },
                type: VideoType.TV
            }];

            const mockSynonym: Synonym = {
                exemptions: 'exempt1,exempt2',
                id: 'synonym-1',
                from: 'Title 2025',
                target: 'Title',
            };

            const results = await NativeSearchService.processCompletedSearch(mockResults, mockTerm, mockSynonym);

            expect(results).toEqual([mockResults[0]]); // Should return the first entry, which doesn't match exclusion terms
        });
    });
});
