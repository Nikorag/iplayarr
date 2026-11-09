/**
 * iPlayarr can be served under a URL prefix (like Sonarr/Radarr's "URL Base"), for example behind a reverse proxy at
 * https://example.com/iplayarr. Nuxt reads the prefix from NUXT_APP_BASE_URL at runtime and prefixes every route and
 * asset itself; this is for the places where iPlayarr builds a URL or a redirect by hand.
 *
 * scripts/start.mjs and nuxt.config.ts turn the friendlier URL_BASE setting into NUXT_APP_BASE_URL.
 */

/** "iplayarr", "/iplayarr/" and "//iplayarr" all become "/iplayarr". Empty and "/" become "" (served from the root). */
export function normalizeBasePath(value?: string | null): string {
    const trimmed = (value ?? '').trim().replace(/^\/+|\/+$/g, '');
    return trimmed ? `/${trimmed}` : '';
}

/** The configured prefix: "" at the root, otherwise "/prefix" with no trailing slash. */
export function getBasePath(): string {
    return normalizeBasePath(process.env.NUXT_APP_BASE_URL);
}

/** Prefixes a server path ("/queue") with the base path. */
export function withBasePath(path: string): string {
    return `${getBasePath()}${path.startsWith('/') ? path : `/${path}`}`;
}
