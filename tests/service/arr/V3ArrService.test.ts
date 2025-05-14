import axios from 'axios';

import V3ArrService from '../../../src/service/arr/V3ArrService';
import { App } from '../../../src/types/App';
import { AppType } from '../../../src/types/AppType';
import { CreateIndexerForm } from '../../../src/types/requests/form/CreateIndexerForm';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('V3ArrService', () => {
    const app: App = {
        api_key: 'test-api-key',
        url: 'http://localhost:8989',
        type: AppType.SONARR,
    } as any;

    describe('search', () => {
        it('should return filtered results with a path', async () => {
            mockedAxios.get.mockResolvedValue({
                status: 200,
                data: [
                    { path: '/path/1' },
                    { path: null },
                ],
            });

            const results = await V3ArrService.search(app, 'term');
            expect(results).toEqual([{ path: '/path/1' }]);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://localhost:8989/api/v3/series/lookup?term=term',
                { headers: { 'X-Api-Key': 'test-api-key' } }
            );
        });

        it('should throw on error', async () => {
            mockedAxios.get.mockRejectedValue(new Error('fail'));
            await expect(V3ArrService.search(app, 'term')).rejects.toThrow('fail');
        });
    });

    describe('getIndexer', () => {
        it('should return indexer details if found', async () => {
            const appWithIndexer: App = {
                ...app, indexer: {
                    id: 5,
                    priority: 0
                }
            };
            mockedAxios.get.mockResolvedValue({
                status: 200,
                data: {
                    id: 5,
                    name: 'Test Indexer',
                    fields: [
                        { name: 'baseUrl', value: 'http://indexer.url' },
                        { name: 'apiKey', value: 'abc123' },
                    ],
                },
            });

            const result = await V3ArrService.getIndexer(appWithIndexer);
            expect(result).toEqual({
                id: 5,
                name: 'Test Indexer',
                url: 'http://indexer.url',
                api_key: 'abc123',
            });
        });

        it('should return undefined on 404', async () => {
            mockedAxios.get.mockRejectedValue({ response: { status: 404 }, isAxiosError: true });
            mockedAxios.isAxiosError.mockReturnValue(true);
            const result = await V3ArrService.getIndexer({
                ...app, indexer: {
                    id: 1,
                    priority: 0
                }
            });
            expect(result).toBeUndefined();
        });
    });

    describe('getTags', () => {
        it('should return tags when request succeeds', async () => {
            mockedAxios.get.mockResolvedValue({
                status: 200,
                data: [{ id: 1, label: 'HD' }],
            });

            const tags = await V3ArrService.getTags(app);
            expect(tags).toEqual([{ id: 1, label: 'HD' }]);
        });

        it('should return empty array on failure', async () => {
            mockedAxios.get.mockRejectedValue(new Error('fail'));
            const tags = await V3ArrService.getTags(app);
            expect(tags).toEqual([]);
        });
    });

    describe('upsertIndexer', () => {
        const form: CreateIndexerForm = {
            name: 'Test',
            url: 'http://test.com',
            urlBase: '/api',
            apiKey: 'abc',
            categories: [1000],
            tags: [],
            priority: 10,
            appId: 'app1',
            downloadClientId: 5,
        };

        it('should post a new indexer if none exists', async () => {
            const postMock = jest.fn().mockResolvedValue({ data: { id: 123 } });
            mockedAxios.post = postMock;
            mockedAxios.get = jest.fn().mockResolvedValue({ status: 200, data: [] }); // getTags

            const id = await V3ArrService.upsertIndexer(form, app);
            expect(id).toBe(123);
            expect(postMock).toHaveBeenCalled();
        });

        it('should throw if allowCreate is false and no indexer is found', async () => {
            const appWithIndexer: App = {
                ...app, indexer: {
                    id: 999,
                    priority: 0
                }
            };
            mockedAxios.get = jest.fn().mockRejectedValue({ response: { status: 404 }, isAxiosError: true });

            await expect(
                V3ArrService.upsertIndexer(form, appWithIndexer, false)
            ).rejects.toThrow('Existing Download Client not found');
        });
    });
});
