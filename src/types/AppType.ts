export enum AppType {
    SONARR = 'SONARR',
    RADARR = 'RADARR',
    PROWLARR = 'PROWLARR',
    SABNZBD = 'SABNZBD',
    NZBGET = 'NZBGET',
    // LIDARR = 'LIDARR'
}

export enum AppFeature {
    API_KEY = 'api_key',
    CALLBACK = 'callback',
    DOWNLOAD_CLIENT = 'download_client',
    INDEXER = 'indexer',
    USERNAME_PASSWORD = 'username_password',
    PRIORITY = 'priority',
    LINK = 'link',
    TAGS = 'tags',
}

export const appCategories: Record<AppType, number[]> = {
    [AppType.SONARR]: [5030, 5040],
    [AppType.RADARR]: [2010, 2020, 2030, 2040, 2045, 2050, 2060],
    [AppType.PROWLARR]: [5030, 5040, 2010, 2020, 2030, 2040, 2045, 2050, 2060],
    [AppType.SABNZBD]: [],
    [AppType.NZBGET]: [],
};

export const appFeatures: Record<AppType, AppFeature[]> = {
    [AppType.SONARR]: [
        AppFeature.API_KEY,
        AppFeature.CALLBACK,
        AppFeature.DOWNLOAD_CLIENT,
        AppFeature.INDEXER,
        AppFeature.TAGS,
    ],
    [AppType.RADARR]: [
        AppFeature.API_KEY,
        AppFeature.CALLBACK,
        AppFeature.DOWNLOAD_CLIENT,
        AppFeature.INDEXER,
        AppFeature.TAGS,
    ],
    [AppType.PROWLARR]: [
        AppFeature.API_KEY,
        AppFeature.CALLBACK,
        AppFeature.DOWNLOAD_CLIENT,
        AppFeature.INDEXER,
    ],
    [AppType.SABNZBD]: [AppFeature.API_KEY, AppFeature.PRIORITY, AppFeature.LINK],
    [AppType.NZBGET]: [AppFeature.USERNAME_PASSWORD, AppFeature.PRIORITY, AppFeature.LINK],
};
