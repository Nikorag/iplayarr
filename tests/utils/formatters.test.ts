import { formatBytes } from '../../src/utils/formatters';

describe('formatBytes', () => {
    it('formats bytes correctly', () => {
        expect(formatBytes(0)).toBe('0 Bytes');
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('returns without unit when unit = false', () => {
        expect(formatBytes(1024, false)).toBe('1');
    });
});
