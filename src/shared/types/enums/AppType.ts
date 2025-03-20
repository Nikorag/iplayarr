export enum AppType {
    SONARR = 'SONARR',
    RADARR = 'RADARR',
    PROWLARR = 'PROWLARR',
    SABNZBD = 'SABNZBD',
    NZBGET = 'NZBGET'
    // LIDARR = 'LIDARR'
}

export enum AppFeature {
    API_KEY = 'api_key',
    CALLBACK = 'callback',
    DOWNLOAD_CLIENT = 'download_client',
    INDEXER = 'indexer',
    PROWLARR_DOWNLOAD_CLIENT = 'prowlarr_download_client',
    PROWLARR_INDEXER = 'prowlarr_indexer',
    USERNAME_PASSWORD = 'username_password',
    PRIORITY = 'priority',
}

export const appCategories : Record<AppType, number[]> = {
    [AppType.SONARR]: [5030, 5040],
    [AppType.RADARR]: [2010, 2020, 2030, 2040, 2045, 2050, 2060],
    [AppType.PROWLARR]: [5030, 5040, 2010, 2020, 2030, 2040, 2045, 2050, 2060],
    [AppType.SABNZBD]: [],
    [AppType.NZBGET]: []
}

export const appFeatures : Record<AppType, AppFeature[]> = {
    [AppType.SONARR]: [AppFeature.API_KEY, AppFeature.CALLBACK, AppFeature.DOWNLOAD_CLIENT, AppFeature.INDEXER],
    [AppType.RADARR]: [AppFeature.API_KEY, AppFeature.CALLBACK, AppFeature.DOWNLOAD_CLIENT, AppFeature.INDEXER],
    [AppType.PROWLARR]: [AppFeature.API_KEY, AppFeature.CALLBACK, AppFeature.PROWLARR_DOWNLOAD_CLIENT, AppFeature.PROWLARR_INDEXER],
    [AppType.SABNZBD]: [AppFeature.API_KEY, AppFeature.PRIORITY],
    [AppType.NZBGET]: [AppFeature.USERNAME_PASSWORD, AppFeature.PRIORITY]
}