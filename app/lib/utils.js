// iPlayarr can be served under a URL prefix (for example behind a reverse proxy at /iplayarr). Nuxt embeds the prefix
// it is running with in the page, so read it from there rather than baking it into the build.
// Returns '' at the root, otherwise '/prefix' with no trailing slash.
export const getBasePath = () => {
    const base = (typeof window !== 'undefined' && window.__NUXT__?.config?.app?.baseURL) || '/';
    const trimmed = String(base).replace(/^\/+|\/+$/g, '');
    return trimmed ? `/${trimmed}` : '';
};

// The API is served by the same Nuxt server as the frontend, so requests go to the same origin under the prefix
export const getHost = () => getBasePath();

// Prefixes a public asset path ('/img/sonarr.svg') with the URL prefix, which Nuxt doesn't do for absolute paths
export const assetUrl = (path) => `${getBasePath()}${path.startsWith('/') ? path : `/${path}`}`;

export const getPidFromBBCUrl = (url) => {
    if (!url) {
        return undefined;
    }
    const match = url.match(/https:\/\/www\.bbc\.co\.uk\/iplayer\/[^?]+\/(m[0-9a-z]{7})\/[^?]+/);
    return match ? match[1] : undefined;
}

export const formatStorageSize = (mb) => {
    if (mb) {
        if (mb >= 1024) {
            return (mb / 1024).toFixed(2) + ' GB';
        }
        return mb.toFixed(2) + ' MB';
    }
    return;
};

export const enforceMaxLength = (arr, maxLength) => {
    if (arr.length > maxLength) {
        arr.splice(0, arr.length - maxLength);
    }
};

export function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function deepCopy(input) {
    return input ? JSON.parse(JSON.stringify(input)) : undefined;
}

export function getCleanSceneTitle(title) {
    if (!title || title.trim().length === 0) {
        return '';
    }

    const beginningThe = /^The\s/i;
    const specialCharacter = /[`'.]/g;
    const nonWord = /\W/g;

    let cleanTitle = title.replace(beginningThe, '');
    cleanTitle = cleanTitle.replaceAll('&', 'and');
    cleanTitle = cleanTitle.replace(specialCharacter, '');
    cleanTitle = cleanTitle.replace(nonWord, '+');

    // Remove any repeating +s
    cleanTitle = cleanTitle.replace(/\+{2,}/g, '+');

    cleanTitle = cleanTitle.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    cleanTitle = cleanTitle.replace(/^\++|\++$/, '');
    return cleanTitle.trim().replaceAll('+', ' ');
}

export function formatDate(dateString, dateStyle, timeStyle) {
    const date = dateString != null ? new Date(dateString) : undefined;
    return isNaN(date?.getTime())
        ? undefined
        : new Intl.DateTimeFormat('en-GB', {
              dateStyle: dateStyle ?? 'medium',
              timeStyle: timeStyle ?? 'short',
              hour12: true,
          }).format(date);
}
