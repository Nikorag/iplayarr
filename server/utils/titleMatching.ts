/**
 * Programme titles reach iPlayarr in slightly different spellings depending on who wrote them: Sonarr searches for
 * "Him and Her" while the BBC calls it "Him & Her", a search might include a year, and punctuation or accents vary.
 * These helpers reduce a title to a comparable form so those differences don't stop a match.
 */

/** Lower case, accents folded away, "&" read as "and", and everything that isn't a letter or digit reduced to one space. */
export function normalizeTitle(title: string): string {
    return title
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLocaleLowerCase()
        .replace(/&/g, ' and ')
        // Unicode aware, so titles in other scripts (Welsh, Gaelic, anything) still compare as themselves
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

/** As normalizeTitle, but without a trailing year ("(2020)" or "2020"). */
export function normalizeTitleWithoutYear(title: string): string {
    return normalizeTitle(title).replace(/\s(19|20)\d{2}$/, '');
}
