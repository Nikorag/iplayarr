/**
 * Integration test setup.
 * IMPORTANT: No mocks. No dotenv mock. Real HTTP only.
 * Tests are skipped when their required env vars are absent.
 */

export interface ServiceConfig {
    url: string;
    apiKey: string;
    available: boolean;
}

export interface IntegrationEnv {
    sonarr: ServiceConfig;
    radarr: ServiceConfig;
    sabnzbd: ServiceConfig;
    nzbhydra2: ServiceConfig;
    iplayarr: ServiceConfig;
}

export const integrationEnv: IntegrationEnv = {
    sonarr: {
        url: process.env.SONARR_URL || '',
        apiKey: process.env.SONARR_API_KEY || '',
        // Sonarr/Radarr/SABnzbd require explicit URL because they have no safe default.
        available: !!(process.env.SONARR_URL && process.env.SONARR_API_KEY),
    },
    radarr: {
        url: process.env.RADARR_URL || '',
        apiKey: process.env.RADARR_API_KEY || '',
        available: !!(process.env.RADARR_URL && process.env.RADARR_API_KEY),
    },
    sabnzbd: {
        url: process.env.SABNZBD_URL || '',
        apiKey: process.env.SABNZBD_API_KEY || '',
        available: !!(process.env.SABNZBD_URL && process.env.SABNZBD_API_KEY),
    },
    nzbhydra2: {
        // NZBHydra2 and iPlayarr have well-known LAN defaults on this stack (vlan107),
        // so available is keyed only on the API key — the URL defaults are safe to use.
        url: process.env.NZBHYDRA2_URL || 'http://192.168.107.30:5076',
        apiKey: process.env.NZBHYDRA2_API_KEY || '',
        available: !!(process.env.NZBHYDRA2_API_KEY),
    },
    iplayarr: {
        url: process.env.IPLAYARR_URL || 'http://192.168.107.127:4404',
        apiKey: process.env.IPLAYARR_API_KEY || '',
        available: !!(process.env.IPLAYARR_API_KEY),
    },
};

/** Generate a unique name suffix so parallel runs and retries don't collide. */
export const testSuffix = (): string =>
    Math.random().toString(36).slice(2, 8);
