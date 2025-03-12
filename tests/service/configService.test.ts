import storage from 'node-persist';

import configService from '../../src/service/configService';
import { IplayarrParameter } from '../../src/types/IplayarrParameters';

// Mocking node-persist
jest.mock('node-persist', () => {
    const mockStorage : any = {
        init: jest.fn(async () => { }),
        getItem: jest.fn(async (key: string) => {
            if (key === 'config') {
                return mockStorage.config;
            }
            return undefined;
        }),
        setItem: jest.fn(async (key: string, value: any) => {
            if (key === 'config') {
                mockStorage.config = value;
            }
        }),
        removeItem: jest.fn(async (key: string) => {
            if (key === 'config') {
                delete mockStorage.config;
            }
        }),
        config: {} as any,
    };
    return mockStorage;
});

describe('configService', () => {
    beforeEach(async () => {
        // Reset mock storage before each test
        (storage.setItem as jest.Mock).mockClear();
        (storage.getItem as jest.Mock).mockClear();
        configService.resetConfigService();
        await storage.init();
        (storage.getItem as jest.Mock).mockImplementation(async (key: string) => {
            if (key === 'config') {
                return (storage as any).config;
            }
            return undefined;
        });
    });

    it('should get a parameter from the default config if not set', async () => {
        const parameter = await configService.getParameter(IplayarrParameter.DEBUG);
        expect(parameter).toBe('false');
    });

    it('should get a parameter from environment variables if set', async () => {
        process.env.DEBUG = 'true';
        const parameter = await configService.getParameter(IplayarrParameter.DEBUG);
        expect(parameter).toBe('true');
        delete process.env.DEBUG;
    });

    it('should get a parameter from storage if set', async () => {
        (storage as any).config = { [IplayarrParameter.DEBUG]: 'true' };
        (storage.getItem as jest.Mock).mockResolvedValue((storage as any).config);

        const parameter = await configService.getParameter(IplayarrParameter.DEBUG);
        expect(parameter).toBe('true');
    });

    it('should set a parameter in storage', async () => {
        await configService.setParameter(IplayarrParameter.DEBUG, 'true');
        expect((storage.setItem as jest.Mock).mock.calls[0][1]).toEqual({ 'DEBUG': 'true' });
    });

    it('should remove a parameter from storage', async () => {
        (storage as any).config = { [IplayarrParameter.DEBUG]: 'true' };
        (storage.getItem as jest.Mock).mockResolvedValue((storage as any).config);

        await configService.removeParameter(IplayarrParameter.DEBUG);
        expect((storage.setItem as jest.Mock).mock.calls[0][1]).toEqual({});
    });

    it('should getAllConfig', async () => {
        (storage as any).config = { [IplayarrParameter.DEBUG]: 'true' };
        (storage.getItem as jest.Mock).mockResolvedValue((storage as any).config);
        process.env.ACTIVE_LIMIT = '4';

        const allConfig = await configService.getAllConfig();
        expect(allConfig[IplayarrParameter.DEBUG]).toBe('true');
        expect(allConfig[IplayarrParameter.ACTIVE_LIMIT]).toBe('4');
    });
});