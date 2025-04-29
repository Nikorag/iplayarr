import axios from 'axios';

import episodeCacheService from '../../../src/service//episodeCacheService';
import iplayerDetailsService from '../../../src/service/iplayerDetailsService';
import NativeSearchService from '../../../src/service/search/NativeSearchService';
import { IPlayerSearchResult, VideoType } from '../../../src/types/IPlayerSearchResult';
import { IPlayerChildrenResponse } from '../../../src/types/responses/IPlayerMetadataResponse';
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
        mockTerm = 'testTerm';
        mockSizeFactor = 1;

        // Mocking the getQualityProfile function
        (getQualityProfile as jest.Mock).mockResolvedValue({ sizeFactor: mockSizeFactor });

        const childrenResponse : IPlayerChildrenResponse = {
            children : {
                page : 1,
                total : 1,
                programmes : [
                    {
                        type: 'episode',
                        pid: '1234',
                        title: 'Episode Title',
                        first_broadcast_date: '1990-13-01'
                    }
                ]
            }
        };

        // Mocking axios responses
        (axios.get as jest.Mock).mockResolvedValueOnce({
            status: 200,
            data: {
                new_search: {
                    results: [{ id: 'testId' }],
                },
            }
        });

        (axios.get as jest.Mock).mockResolvedValueOnce({
            status: 200,
            data: childrenResponse,
        });

        // Mocking episodeCacheService.findBrandForPid
        (episodeCacheService.findBrandForPid as jest.Mock).mockResolvedValue('testBrandPid');

        // Mocking iplayerDetailsService.details
        (iplayerDetailsService.details as jest.Mock).mockResolvedValue([{ title: 'Test Title', pid: 'testPid', type: 'episode', firstBroadcast: '2025-01-01', runtime: 60 }]);

        // Mocking createNZBName
        (createNZBName as jest.Mock).mockResolvedValue('testNZBName');
    });

    describe('search', () => {
        it('should return search results with valid data', async () => {
            const results = await NativeSearchService.search(mockTerm, mockSynonym);

            expect(results).toHaveLength(1); // Expect one result to be returned
            expect(results[0]).toHaveProperty('title', 'Test Title');
            expect(results[0]).toHaveProperty('pid', 'testPid');
            expect(results[0]).toHaveProperty('nzbName', 'testNZBName');
        });

        it('should return an empty array when the response status is not 200', async () => {
            (axios.get as jest.Mock).mockReset();
            (axios.get as jest.Mock).mockResolvedValue({
                status: 500,
                data: {},
            });

            const results = await NativeSearchService.search(mockTerm);

            expect(results).toHaveLength(0); // Should return empty array on failure
        });

        it('should handle the case when there are no results', async () => {
            (axios.get as jest.Mock).mockReset();
            (axios.get as jest.Mock).mockResolvedValueOnce({
                status: 200,
                data: { new_search: { results: [] } },
            });

            const results = await NativeSearchService.search(mockTerm);

            expect(results).toHaveLength(0); // Should return empty array when no results
        });
    });

    describe('processCompletedSearch', () => {
        it('should return the results unmodified', async () => {
            const mockResults : IPlayerSearchResult[] = [{
                title: 'Test Title', pid: 'testPid',
                number: 1,
                channel: 'Channel 1',
                request: {
                    term: 'term',
                    line: 'line'
                },
                type: VideoType.TV
            }];
            const results = await NativeSearchService.processCompletedSearch(mockResults);

            expect(results).toEqual(mockResults); // Should return the results as they are
        });
    });
});
