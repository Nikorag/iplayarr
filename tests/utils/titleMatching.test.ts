import { normalizeTitle, normalizeTitleWithoutYear } from '../../server/utils/titleMatching';

describe('titleMatching', () => {
    describe('normalizeTitle', () => {
        it.each([
            ['Him & Her', 'him and her'],
            ['Him and Her', 'him and her'],
            ['Him&Her', 'him and her'],
            ['  The   Apprentice: UK!  ', 'the apprentice uk'],
            ['apprentice-uk', 'apprentice uk'],
            ['Café Show', 'cafe show'],
            ['Cŵn Bach', 'cwn bach'],
            ['Mrs. Brown\'s Boys', 'mrs brown s boys'],
        ])('reduces %p to %p', (input, expected) => {
            expect(normalizeTitle(input)).toBe(expected);
        });

        it('keeps titles in other scripts distinct instead of reducing them to nothing', () => {
            expect(normalizeTitle('Привет мир')).toBe('привет мир');
            expect(normalizeTitle('你好')).toBe('你好');
            expect(normalizeTitle('Привет')).not.toBe(normalizeTitle('ЭВМ'));
        });

        it('is empty for a title that is only punctuation', () => {
            expect(normalizeTitle('*')).toBe('');
            expect(normalizeTitle(' - ')).toBe('');
        });
    });

    describe('normalizeTitleWithoutYear', () => {
        it.each([
            ['Welsh Language on Tour (2020)', 'welsh language on tour'],
            ['Welsh Language on Tour 2020', 'welsh language on tour'],
            ['Doctor Who 1963', 'doctor who'],
            ['Welsh Language on Tour', 'welsh language on tour'],
        ])('removes a trailing year from %p', (input, expected) => {
            expect(normalizeTitleWithoutYear(input)).toBe(expected);
        });

        it('leaves numbers that are not a trailing year alone', () => {
            expect(normalizeTitleWithoutYear('2001 A Space Odyssey')).toBe('2001 a space odyssey');
            expect(normalizeTitleWithoutYear('Channel 4 News')).toBe('channel 4 news');
            expect(normalizeTitleWithoutYear('Apollo 13')).toBe('apollo 13');
        });
    });
});
