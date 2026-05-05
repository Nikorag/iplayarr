import { formatBytes, formatSabnzbdSpeedKbps } from '../../src/utils/formatters';

describe('formatSabnzbdSpeedKbps', () => {
    it('returns SABnzbd-style zero when idle', () => {
        expect(formatSabnzbdSpeedKbps(0)).toBe('0 ');
        expect(formatSabnzbdSpeedKbps(-1)).toBe('0 ');
    });

    it('idle trailing space is load-bearing — Homepage fromUnits() splits on space to find unit', () => {
        const idle = formatSabnzbdSpeedKbps(0);
        const [value, unit] = idle.split(' ');
        expect(value).toBe('0');
        expect(unit).toBe('');  // empty unit, not undefined — the space must be present
    });

    it('formats KB/s tier', () => {
        expect(formatSabnzbdSpeedKbps(50)).toBe('50.0 K');
    });

    it('formats MB/s tier like SABnzbd / Homepage examples', () => {
        expect(formatSabnzbdSpeedKbps(1296.02)).toBe('1.3 M');
    });
});

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
