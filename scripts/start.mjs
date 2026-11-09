// Starts the production Nuxt server, defaulting to port 4404 (iPlayarr's historical default) when PORT isn't set.
process.env.PORT ??= '4404';

// URL_BASE ("iplayarr" or "/iplayarr") serves iPlayarr under that prefix, like Sonarr/Radarr's URL Base. Nuxt reads the
// prefix from NUXT_APP_BASE_URL at runtime, so set that from it (an explicit NUXT_APP_BASE_URL wins).
const urlBase = (process.env.URL_BASE ?? '').trim().replace(/^\/+|\/+$/g, '');
if (urlBase) {
    process.env.NUXT_APP_BASE_URL ??= `/${urlBase}`;
}

await import('../.output/server/index.mjs');
