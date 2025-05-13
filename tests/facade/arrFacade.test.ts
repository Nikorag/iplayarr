import { ArrServiceDirectory } from '../../src/constants/ArrServiceDirectory';
import ArrFacade from '../../src/facade/arrFacade';
import AbstractArrService, { ArrTag } from '../../src/service/arr/AbstractArrService';
import { App } from '../../src/types/App';
import { CreateDownloadClientForm } from '../../src/types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../../src/types/requests/form/CreateIndexerForm';
import { ArrLookupResponse } from '../../src/types/responses/arr/ArrLookupResponse';
import { DownloadClientResponse } from '../../src/types/responses/arr/DownloadClientResponse';
import { IndexerResponse } from '../../src/types/responses/arr/IndexerResponse';

// Create a mock service
const mockService: jest.Mocked<AbstractArrService> = {
    upsertDownloadClient: jest.fn(),
    getDownloadClient: jest.fn(),
    upsertIndexer: jest.fn(),
    getIndexer: jest.fn(),
    testConnection: jest.fn(),
    getTags: jest.fn(),
    createTag: jest.fn(),
    search: jest.fn()
} as any;

const mockApp: App = { type: 'sonarr' } as unknown as App;

beforeEach(() => {
    jest.clearAllMocks();
    (ArrServiceDirectory as any)[mockApp.type] = mockService;
});

describe('ArrFacade', () => {
    it('should delegate upsertDownloadClient to the correct service', async () => {
        mockService.upsertDownloadClient.mockResolvedValue(1);
        const form = {} as CreateDownloadClientForm;
        const result = await ArrFacade.upsertDownloadClient(form, mockApp, true);
        expect(result).toBe(1);
        expect(mockService.upsertDownloadClient).toHaveBeenCalledWith(form, mockApp, true);
    });

    it('should delegate getDownloadClient to the correct service', async () => {
        const mockResponse = {} as DownloadClientResponse;
        mockService.getDownloadClient.mockResolvedValue(mockResponse);
        const result = await ArrFacade.getDownloadClient(mockApp);
        expect(result).toBe(mockResponse);
        expect(mockService.getDownloadClient).toHaveBeenCalledWith(mockApp);
    });

    it('should delegate upsertIndexer to the correct service', async () => {
        mockService.upsertIndexer.mockResolvedValue(42);
        const form = {} as CreateIndexerForm;
        const result = await ArrFacade.upsertIndexer(form, mockApp, false);
        expect(result).toBe(42);
        expect(mockService.upsertIndexer).toHaveBeenCalledWith(form, mockApp, false);
    });

    it('should delegate getIndexer to the correct service', async () => {
        const mockResponse = {} as IndexerResponse;
        mockService.getIndexer.mockResolvedValue(mockResponse);
        const result = await ArrFacade.getIndexer(mockApp);
        expect(result).toBe(mockResponse);
        expect(mockService.getIndexer).toHaveBeenCalledWith(mockApp);
    });

    it('should delegate testConnection to the correct service', async () => {
        mockService.testConnection.mockResolvedValue(true);
        const result = await ArrFacade.testConnection(mockApp);
        expect(result).toBe(true);
        expect(mockService.testConnection).toHaveBeenCalledWith(mockApp);
    });

    it('should delegate getTags to the correct service', async () => {
        const tags: ArrTag[] = [{ id: 1, label: 'tag' }];
        mockService.getTags.mockResolvedValue(tags);
        const result = await ArrFacade.getTags(mockApp);
        expect(result).toEqual(tags);
        expect(mockService.getTags).toHaveBeenCalledWith(mockApp);
    });

    it('should delegate createTag to the correct service', async () => {
        const tag: ArrTag = { id: 2, label: 'new tag' };
        mockService.createTag.mockResolvedValue(tag);
        const result = await ArrFacade.createTag(mockApp, 'new tag');
        expect(result).toEqual(tag);
        expect(mockService.createTag).toHaveBeenCalledWith(mockApp, 'new tag');
    });

    it('should delegate search to the correct service', async () => {
        const results: ArrLookupResponse[] = [{ title: 'show' }] as ArrLookupResponse[];
        mockService.search.mockResolvedValue(results);
        const result = await ArrFacade.search(mockApp, 'query');
        expect(result).toEqual(results);
        expect(mockService.search).toHaveBeenCalledWith(mockApp, 'query');
    });
});
