import { getBasePath, normalizeBasePath, withBasePath } from '../../server/utils/basePath';

describe('basePath', () => {
    const original = process.env.NUXT_APP_BASE_URL;

    afterEach(() => {
        if (original === undefined) {
            delete process.env.NUXT_APP_BASE_URL;
        } else {
            process.env.NUXT_APP_BASE_URL = original;
        }
    });

    describe('normalizeBasePath', () => {
        it.each([
            [undefined, ''],
            [null, ''],
            ['', ''],
            ['/', ''],
            ['  ', ''],
            ['iplayarr', '/iplayarr'],
            ['/iplayarr', '/iplayarr'],
            ['/iplayarr/', '/iplayarr'],
            ['//iplayarr//', '/iplayarr'],
            [' /tools/iplayarr/ ', '/tools/iplayarr'],
        ])('normalises %p to %p', (input, expected) => {
            expect(normalizeBasePath(input)).toBe(expected);
        });
    });

    describe('getBasePath', () => {
        it('is empty when nothing is configured', () => {
            delete process.env.NUXT_APP_BASE_URL;
            expect(getBasePath()).toBe('');
        });

        it('reads and normalises NUXT_APP_BASE_URL', () => {
            process.env.NUXT_APP_BASE_URL = 'iplayarr/';
            expect(getBasePath()).toBe('/iplayarr');
        });
    });

    describe('withBasePath', () => {
        it('leaves paths alone at the root', () => {
            delete process.env.NUXT_APP_BASE_URL;
            expect(withBasePath('/queue')).toBe('/queue');
        });

        it('prefixes paths, with or without a leading slash', () => {
            process.env.NUXT_APP_BASE_URL = '/iplayarr';
            expect(withBasePath('/queue')).toBe('/iplayarr/queue');
            expect(withBasePath('queue')).toBe('/iplayarr/queue');
        });
    });
});
