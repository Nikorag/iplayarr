import appService from '../../src/service/appService';
import { AppFormValidator } from '../../src/validators/AppFormValidator';

jest.mock('../../src/service/appService');

describe('AppFormValidator', () => {
    let validator: AppFormValidator;

    beforeEach(() => {
        validator = new AppFormValidator();
        jest.clearAllMocks();
    });

    it('should return no errors for valid input', async () => {
        const input = {
            indexer: { name: 'IndexerName', priority: 25 },
            download_client: { name: 'DownloadClientName' },
            priority: 10
        };
        (appService.testAppConnection as jest.Mock).mockResolvedValue(true);

        const result = await validator.validate(input);

        expect(result).toEqual({});
    });

    it('should return api_key and url errors if testAppConnection fails', async () => {
        const input = {
            indexer: { name: 'IndexerName', priority: 25 },
            download_client: { name: 'DownloadClientName' },
            priority: 10
        };
        const errorMessage = 'Connection failed';
        (appService.testAppConnection as jest.Mock).mockResolvedValue(errorMessage);

        const result = await validator.validate(input);

        expect(result).toEqual({
            api_key: errorMessage,
            url: errorMessage
        });
    });

    it('should return indexer_name and indexer_priority errors if download_client is missing', async () => {
        const input = {
            indexer: { name: 'IndexerName', priority: 25 },
            priority: 10
        };
        (appService.testAppConnection as jest.Mock).mockResolvedValue(true);

        const result = await validator.validate(input);

        expect(result).toEqual({
            indexer_name: 'Cannot create Indexer without Download Client',
            indexer_priority: 'Cannot create Indexer without Download Client'
        });
    });

    it('should return indexer_priority error if priority is out of range', async () => {
        const input = {
            indexer: { name: 'IndexerName', priority: 55 },
            download_client: { name: 'DownloadClientName' },
            priority: 10
        };
        (appService.testAppConnection as jest.Mock).mockResolvedValue(true);

        const result = await validator.validate(input);

        expect(result).toEqual({
            indexer_priority: 'Priority must be between 0 and 50'
        });
    });

    it('should return priority error if priority is negative', async () => {
        const input = {
            indexer: { name: 'IndexerName', priority: 25 },
            download_client: { name: 'DownloadClientName' },
            priority: -5
        };
        (appService.testAppConnection as jest.Mock).mockResolvedValue(true);

        const result = await validator.validate(input);

        expect(result).toEqual({
            priority: 'Priority must be a positive number'
        });
    });

    it('should return multiple errors if multiple validations fail', async () => {
        const input = {
            indexer: { name: 'IndexerName', priority: 55 },
            priority: -5
        };
        const errorMessage = 'Connection failed';
        (appService.testAppConnection as jest.Mock).mockResolvedValue(errorMessage);

        const result = await validator.validate(input);

        expect(result).toEqual({
            api_key: errorMessage,
            url: errorMessage,
            indexer_name: 'Cannot create Indexer without Download Client',
            indexer_priority: 'Priority must be between 0 and 50',
            priority: 'Priority must be a positive number'
        });
    });
});
