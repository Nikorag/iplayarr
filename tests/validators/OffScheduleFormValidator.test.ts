import iplayerDetailsService from '../../server/service/iplayerDetailsService';
import { OffScheduleFormValidator } from '../../server/validators/OffScheduleFormValidator';

// Mock the iplayerDetailsService
jest.mock('../../server/service/iplayerDetailsService', () => ({
    findBrandForUrl: jest.fn(),
}));

describe('OffScheduleFormValidator', () => {
    let validator: OffScheduleFormValidator;

    beforeEach(() => {
        validator = new OffScheduleFormValidator();
    });

    it('should return no error for a valid URL with a brand PID', async () => {
        (iplayerDetailsService.findBrandForUrl as jest.Mock).mockResolvedValue('b006q2x0');

        const input = { url: 'https://www.bbc.co.uk/programmes/b006q2x0' };
        const result = await validator.validate(input);
        expect(result).toEqual({});
    });

    it('should return an error for an invalid URL with no brand PID', async () => {
        (iplayerDetailsService.findBrandForUrl as jest.Mock).mockResolvedValue(undefined);

        const input = { url: 'https://www.bbc.co.uk/invalid-programme' };
        const result = await validator.validate(input);
        expect(result).toHaveProperty('url', 'Invalid URL');
    });
});
