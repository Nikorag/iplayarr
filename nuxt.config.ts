import { fileURLToPath } from 'node:url';

const lessGlobals = ['variables', 'global']
    .map((name) => `@import "${fileURLToPath(new URL(`./app/assets/styles/${name}.less`, import.meta.url))}";`)
    .join('\n');

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    // iPlayarr is a login-gated dashboard driven by websocket pushes, so there is nothing to server render
    ssr: false,
    devtools: { enabled: false },
    telemetry: false,

    app: {
        head: {
            title: 'iPlayarr',
            htmlAttrs: { lang: 'en' },
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
                { name: 'theme-color', content: '#202020' },
                { name: 'apple-mobile-web-app-capable', content: 'yes' },
                { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            ],
            link: [
                { rel: 'icon', href: '/favicon.ico' },
                { rel: 'apple-touch-icon', href: '/iplayarr.png' },
                { rel: 'manifest', href: '/manifest.webmanifest' },
            ],
        },
    },

    css: ['vue-final-modal/style.css'],

    vite: {
        css: {
            preprocessorOptions: {
                less: { additionalData: lessGlobals },
            },
        },
    },

    nitro: {
        experimental: { websocket: true },
    },

    devServer: { port: 4404 },
});
