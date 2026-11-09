// Starts the production Nuxt server, defaulting to port 4404 (iPlayarr's historical default) when PORT isn't set.
process.env.PORT ??= '4404';

await import('../.output/server/index.mjs');
