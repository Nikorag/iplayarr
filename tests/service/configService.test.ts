import storage from 'node-persist';
jest.mock('node-persist', () => ({
    getItem: jest.fn(),
    init: jest.fn(),
    setItem: jest.fn()
}));

//Object being tested
import { getParameter, resetConfigService, setParameter } from '../../src/service/configService';
import { IplayarrParameter } from '../../src/types/IplayarrParameters';

afterEach(() => {
    jest.clearAllMocks();
    resetConfigService();
});


describe('getParameter', () => {
    it('should return a value from storage if it exists', async () => {
        const mockConfig = {'TEST_PARAM' : 'storedValue'};
        (storage.getItem as jest.Mock).mockResolvedValue(mockConfig);
        

        const result = await getParameter('TEST_PARAM' as IplayarrParameter);
        expect(result).toBe('storedValue');
    });

    it('should return a value from environment if not in storage', async () => {
        (storage.getItem as jest.Mock).mockResolvedValue({});
        process.env.TEST_PARAM = 'environmentValue';

        const result = await getParameter('TEST_PARAM' as IplayarrParameter);
        expect(result).toBe('environmentValue');
        delete process.env.TEST_PARAM;
    });

    it('should return undefined if the parameter is not set in either', async () => {
        (storage.getItem as jest.Mock).mockResolvedValue({});
        delete process.env.TEST_PARAM;;

        const result = await getParameter('TEST_PARAM' as IplayarrParameter);
        expect(result).toBe(undefined);
    });

    it('should only init the storage once', async () => {
        await getParameter('TEST_PARAM' as IplayarrParameter);
        await getParameter('TEST_PARAM_2' as IplayarrParameter);

        expect(storage.init).toHaveBeenCalledTimes(1);
    });
});

describe('setParameter', () => {
    it('should update the parameter in storage', async () => {
        let result = await getParameter('TEST_PARAM' as IplayarrParameter);
        expect(result).toBe(undefined);

        await setParameter('TEST_PARAM' as IplayarrParameter, 'newValue');
        result = await getParameter('TEST_PARAM' as IplayarrParameter);
        expect(result).toBe('newValue');
    });
})