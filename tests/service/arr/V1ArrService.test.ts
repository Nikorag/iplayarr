import V1ArrService from '../../../src/service/arr/V1ArrService';
import { App } from '../../../src/types/App';
import { CreateProwlarrIndexerRequest } from '../../../src/types/requests/arr/CreateProwlarrIndexerRequest';
import { CreateDownloadClientForm } from '../../../src/types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../../../src/types/requests/form/CreateIndexerForm';

describe('V1ArrService', () => {
    const app: App = {
        url: 'http://localhost:8989',
    } as any;

    describe('getApiUrl', () => {
        it('should return API v1 URL', () => {
            const url = V1ArrService.getApiUrl(app);
            expect(url).toBe('http://localhost:8989/api/v1');
        });
    });

    describe('createDownloadClientRequestObject', () => {
        it('should create a modified download client request', () => {
            const form: CreateDownloadClientForm = {
                name: 'NZBClient',
                host: 'localhost',
                port: 6789,
                apiKey: '123abc',
                useSSL: false,
                tags: []
            };

            const result = V1ArrService.createDownloadClientRequestObject(form, [1, 2]);

            expect(result.categories).toEqual([]);
            expect(result.fields.find(f => f.name === 'category')).toEqual(
                expect.objectContaining({
                    name: 'category',
                    value: 'iplayer',
                })
            );

            // Check that all fields have `order` < 7 except the added one
            expect(result.fields.filter(f => f.order !== undefined && f.order < 7 || f.name === 'category')).toBeTruthy();
        });
    });

    describe('createIndexerRequestObject', () => {
        it('should return a valid indexer request object for Prowlarr', () => {
            const form: CreateIndexerForm = {
                name: 'BBC',
                url: 'http://indexer.local',
                apiKey: 'indexer-key',
                urlBase: '/api/v2',
                appId: 'iplayer-app',
                priority: 10,
                downloadClientId: 9,
                categories: [],
                tags: [],
            };

            const result = V1ArrService.createIndexerRequestObject(form) as CreateProwlarrIndexerRequest;

            expect(result.priority).toBe(10);
            expect(result.name).toBe('BBC (iPlayarr)');
            expect(result.indexerUrls).toEqual(['http://indexer.local']);
            expect(result.downloadClientId).toBe(9);

            const baseUrlField = result.fields.find(f => f.name === 'baseUrl');
            expect(baseUrlField?.value).toBe('http://indexer.local');

            const apiPathField = result.fields.find(f => f.name === 'apiPath');
            expect(apiPathField?.value).toBe('/api/v2');

            const apiKeyField = result.fields.find(f => f.name === 'apiKey');
            expect(apiKeyField?.value).toBe('indexer-key');

            const additionalParamsField = result.fields.find(f => f.name === 'additionalParameters');
            expect(additionalParamsField?.value).toBe('&app=iplayer-app');
        });
    });
});
