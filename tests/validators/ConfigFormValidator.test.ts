import nzbFacade from '../../src/facade/nzbFacade';
import { ConfigFormValidator } from '../../src/validators/ConfigFormValidator';

// Mock nzbFacade
jest.mock('../../src/facade/nzbFacade', () => ({
    testConnection: jest.fn(),
}));

describe('ConfigFormValidator', () => {
    let validator: ConfigFormValidator;

    beforeEach(() => {
        validator = new ConfigFormValidator();

        // Stub directoryExists and isNumber
        validator.directoryExists = jest.fn((dir) => dir === '/valid/path');
        validator.isNumber = jest.fn((val) => !isNaN(Number(val)));
    });

    it('should return no errors for valid input', async () => {
        (nzbFacade.testConnection as jest.Mock).mockResolvedValue(true);

        const validInput = {
            DOWNLOAD_DIR: '/valid/path',
            COMPLETE_DIR: '/valid/path',
            ACTIVE_LIMIT: 5,
            RSS_FEED_HOURS: 3,
            AUTH_USERNAME: 'user',
            AUTH_PASSWORD: 'pass',
            REFRESH_SCHEDULE: '0 0 * * *',
            TV_FILENAME_TEMPLATE: '{{title}}.S{{season}}E{{episode}}.{{quality}}',
            MOVIE_FILENAME_TEMPLATE: '{{title}}.{{quality}}',
            NZB_TYPE: 'nzbget',
            NZB_URL: 'http://example.com',
            NZB_API_KEY: 'apikey',
            NZB_USERNAME: 'nzbuser',
            NZB_PASSWORD: 'nzbpass',
        };

        const result = await validator.validate(validInput);
        expect(result).toEqual({});
    });

    it('should validate missing directories', async () => {
        validator.directoryExists = jest.fn(() => false);
        const result = await validator.validate({ DOWNLOAD_DIR: '/bad', COMPLETE_DIR: '/bad' });
        expect(result.DOWNLOAD_DIR).toMatch(/does not exist/);
        expect(result.COMPLETE_DIR).toMatch(/does not exist/);
    });

    it('should validate number fields', async () => {
        const input = {
            DOWNLOAD_DIR: '/valid/path',
            COMPLETE_DIR: '/valid/path',
            ACTIVE_LIMIT: -1,
            RSS_FEED_HOURS: 'abc',
        };

        const result = await validator.validate(input);
        expect(result.ACTIVE_LIMIT).toMatch(/positive number/);
        expect(result.RSS_FEED_HOURS).toMatch(/must be a number/);
    });

    it('should validate missing auth', async () => {
        const result = await validator.validate({});
        expect(result.AUTH_USERNAME).toMatch(/provide a Username/);
        expect(result.AUTH_PASSWORD).toMatch(/provide a Password/);
    });

    it('should validate invalid cron expression', async () => {
        const input = {
            REFRESH_SCHEDULE: 'invalid cron',
        };
        const result = await validator.validate(input);
        expect(result.REFRESH_SCHEDULE).toMatch(/valid cron expression/);
    });

    it('should catch invalid Handlebars template', async () => {
        const input = {
            TV_FILENAME_TEMPLATE: '{{invalid',
            MOVIE_FILENAME_TEMPLATE: '{{title}} {{#if}}',
        };
        const result = await validator.validate(input);
        expect(result.TV_FILENAME_TEMPLATE).toMatch(/does not compile/);
        expect(result.MOVIE_FILENAME_TEMPLATE).toMatch(/does not compile/);
    });

    it('should return errors from NZB connection test', async () => {
        (nzbFacade.testConnection as jest.Mock).mockResolvedValue('Connection failed');

        const input = {
            DOWNLOAD_DIR: '/valid/path',
            COMPLETE_DIR: '/valid/path',
            ACTIVE_LIMIT: 1,
            RSS_FEED_HOURS: 1,
            AUTH_USERNAME: 'user',
            AUTH_PASSWORD: 'pass',
            REFRESH_SCHEDULE: '0 0 * * *',
            TV_FILENAME_TEMPLATE: '{{title}}.S{{season}}E{{episode}}.{{quality}}',
            MOVIE_FILENAME_TEMPLATE: '{{title}}.{{quality}}',
            NZB_TYPE: 'nzbget',
            NZB_URL: 'http://bad.url',
            NZB_API_KEY: 'badkey',
            NZB_USERNAME: 'baduser',
            NZB_PASSWORD: 'badpass',
        };

        const result = await validator.validate(input);
        expect(result.NZB_URL).toBe('Connection failed');
        expect(result.NZB_API_KEY).toBe('Connection failed');
        expect(result.NZB_USERNAME).toBe('Connection failed');
        expect(result.NZB_PASSWORD).toBe('Connection failed');
    });
});
