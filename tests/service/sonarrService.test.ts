import arrService from '../../src/service/arrService';
import configService from '../../src/service/configService';
import sonarrService from '../../src/service/sonarrService';
import { IplayarrParameter } from '../../src/types/IplayarrParameters';
import { CreateDownloadClientForm } from '../../src/types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../../src/types/requests/form/CreateIndexerForm';

// Mocking configService
jest.mock('../../src/service/configService', () => ({
    getParameter: jest.fn(),
}));

// Mocking arrService
jest.mock('../../src/service/arrService', () => ({
    getDownloadClient: jest.fn(),
    createUpdateDownloadClient: jest.fn(),
    getIndexer: jest.fn(),
    createUpdateIndexer: jest.fn(),
}));

describe('sonarrService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getConfig', () => {
        it('should get config parameters and return an ArrConfig object', async () => {
            (configService.getParameter as jest.Mock).mockImplementation(async (key: IplayarrParameter) => {
                switch (key) {
                    case IplayarrParameter.SONARR_API_KEY: return 'test_api_key';
                    case IplayarrParameter.SONARR_HOST: return 'http://localhost:8989';
                    case IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID: return '1';
                    case IplayarrParameter.SONARR_INDEXER_ID: return '2';
                    default: return undefined;
                }
            });

            const config = await sonarrService.getConfig();

            expect(configService.getParameter).toHaveBeenCalledTimes(4);
            expect(config.API_KEY).toBe('test_api_key');
            expect(config.HOST).toBe('http://localhost:8989');
            expect(config.DOWNLOAD_CLIENT_ID).toBe(1);
            expect(config.INDEXER_ID).toBe(2);
        });

        it('should return undefined for DOWNLOAD_CLIENT_ID and INDEXER_ID when not set', async () => {
            (configService.getParameter as jest.Mock).mockImplementation(async (key: IplayarrParameter) => {
                switch (key) {
                    case IplayarrParameter.SONARR_API_KEY: return 'test_api_key';
                    case IplayarrParameter.SONARR_HOST: return 'http://localhost:8989';
                    default: return undefined;
                }
            });

            const config = await sonarrService.getConfig();

            expect(config.DOWNLOAD_CLIENT_ID).toBeUndefined();
            expect(config.INDEXER_ID).toBeUndefined();
        });
    });

    describe('getDownloadClient', () => {
        it('should return a download client when SONARR_DOWNLOAD_CLIENT_ID is set', async () => {
            const mockDownloadClient = { id: 1, name: 'testClient' };
            (configService.getParameter as jest.Mock).mockResolvedValue('1');
            (arrService.getDownloadClient as jest.Mock).mockResolvedValue(mockDownloadClient);

            const downloadClient = await sonarrService.getDownloadClient();

            expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);
            expect(arrService.getDownloadClient).toHaveBeenCalledWith(1, expect.anything());
            expect(downloadClient).toEqual(mockDownloadClient);
        });

        it('should return undefined when SONARR_DOWNLOAD_CLIENT_ID is not set', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue(undefined);

            const downloadClient = await sonarrService.getDownloadClient();

            expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);
            expect(arrService.getDownloadClient).not.toHaveBeenCalled();
            expect(downloadClient).toBeUndefined();
        });
    });

    describe('createUpdateDownloadClient', () => {
        it('should call arrService.createUpdateDownloadClient and return the id', async () => {
            const mockForm: CreateDownloadClientForm = { name: 'test', host: 'localhost', port: 8080, apiKey: 'apikey', useSSL : false };
            (arrService.createUpdateDownloadClient as jest.Mock).mockResolvedValue(123);
            (configService.getParameter as jest.Mock).mockImplementation(async (key: IplayarrParameter) => {
                switch (key) {
                    case IplayarrParameter.SONARR_API_KEY: return 'test_api_key';
                    case IplayarrParameter.SONARR_HOST: return 'http://localhost:8989';
                    default: return undefined;
                }
            });

            const id = await sonarrService.createUpdateDownloadClient(mockForm);

            expect(arrService.createUpdateDownloadClient).toHaveBeenCalledWith(mockForm, expect.anything(), IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);
            expect(id).toBe(123);
        });

        it('should throw an error if arrService.createUpdateDownloadClient throws an error', async () => {
            const mockForm: CreateDownloadClientForm = { name: 'test', host: 'localhost', port: 8080, apiKey: 'apikey', useSSL : false };
            const mockError = new Error('Test error');
            (arrService.createUpdateDownloadClient as jest.Mock).mockRejectedValue(mockError);
             (configService.getParameter as jest.Mock).mockImplementation(async (key: IplayarrParameter) => {
                switch (key) {
                    case IplayarrParameter.SONARR_API_KEY: return 'test_api_key';
                    case IplayarrParameter.SONARR_HOST: return 'http://localhost:8989';
                    default: return undefined;
                }
            });


            await expect(sonarrService.createUpdateDownloadClient(mockForm)).rejects.toThrow(mockError);
            expect(arrService.createUpdateDownloadClient).toHaveBeenCalledWith(mockForm, expect.anything(), IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);
        });
    });

    describe('getIndexer', () => {
        it('should return an indexer when SONARR_INDEXER_ID is set', async () => {
            const mockIndexer = { id: 2, name: 'testIndexer' };
            (configService.getParameter as jest.Mock).mockResolvedValue('2');
            (arrService.getIndexer as jest.Mock).mockResolvedValue(mockIndexer);

            const indexer = await sonarrService.getIndexer();

            expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.SONARR_INDEXER_ID);
            expect(arrService.getIndexer).toHaveBeenCalledWith(2, expect.anything());
            expect(indexer).toEqual(mockIndexer);
        });

        it('should return undefined when SONARR_INDEXER_ID is not set', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue(undefined);

            const indexer = await sonarrService.getIndexer();

            expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.SONARR_INDEXER_ID);
            expect(arrService.getIndexer).not.toHaveBeenCalled();
            expect(indexer).toBeUndefined();
        });
    });

    describe('createUpdateIndexer', () => {
        it('should call arrService.createUpdateIndexer and return the id', async () => {
            const mockForm: CreateIndexerForm = {
                name: 'test',
                downloadClientId: 0,
                url: 'http://localhost',
                apiKey: 'apiKey',
                categories: []
            };
            (arrService.createUpdateIndexer as jest.Mock).mockResolvedValue(456);
            (configService.getParameter as jest.Mock).mockImplementation(async (key: IplayarrParameter) => {
                switch (key) {
                    case IplayarrParameter.SONARR_API_KEY: return 'test_api_key';
                    case IplayarrParameter.SONARR_HOST: return 'http://localhost:8989';
                    default: return undefined;
                }
            });

            const id = await sonarrService.createUpdateIndexer(mockForm);

            expect(arrService.createUpdateIndexer).toHaveBeenCalledWith(mockForm, expect.anything(), IplayarrParameter.SONARR_INDEXER_ID);
            expect(id).toBe(456);
        });

        it('should throw an error if arrService.createUpdateIndexer throws an error', async () => {
            const mockForm: CreateIndexerForm = {
                name: 'test', url: 'http://localhost',
                downloadClientId: 0,
                apiKey: '',
                categories: []
            };
            const mockError = new Error('Test error');
            (arrService.createUpdateIndexer as jest.Mock).mockRejectedValue(mockError);
            (configService.getParameter as jest.Mock).mockImplementation(async (key: IplayarrParameter) => {
                switch (key) {
                    case IplayarrParameter.SONARR_API_KEY: return 'test_api_key';
                    case IplayarrParameter.SONARR_HOST: return 'http://localhost:8989';
                    default: return undefined;
                }
            });

            await expect(sonarrService.createUpdateIndexer(mockForm)).rejects.toThrow(mockError);
            expect(arrService.createUpdateIndexer).toHaveBeenCalledWith(mockForm, expect.anything(), IplayarrParameter.SONARR_INDEXER_ID);
        });
    });
});