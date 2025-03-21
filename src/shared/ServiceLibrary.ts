
export interface Service {
    name: string,
    type: any,
    customPath?: string,
    route?: string,
    storageService?: string,
    dependency?: Dependency,
    model?: string,
    apiTag?: string,
    microservices?: {
        name : string,
        method : 'GET' | 'POST' | 'PUT' | 'DELETE',
        path : string
        dependencies?: Dependency[],
        body? : string,
        params? : Parameter[],
        query? : Parameter[],
        result : string
    }[]
}

interface Dependency {
    importFrom: string,
    from: string
}

export interface Parameter {
    name : string,
    type : string
}

export const ServiceLibrary: Service[] = [
    {
        name: 'synonyms',
        type: [],
        route: 'SynonymsRoute',
        dependency: {
            importFrom: 'Synonym',
            from: 'Synonym'
        },
        model: 'Synonym',
        microservices: [
            {
                name: 'searchHistory',
                method: 'GET',
                path: '/searchHistory',
                result: 'SearchHistoryEntry[]',
                dependencies: [
                    {
                        importFrom: 'SearchHistoryEntry',
                        from: 'SearchHistoryEntry'
                    }
                ]  
            },
            {
                name: 'lookup',
                method: 'GET',
                path: '/lookup/{appId}',
                result: 'SearchHistoryEntry[]',
                dependencies: [
                    {
                        importFrom: 'ArrLookupResponse',
                        from: '../resposes/arr/ArrLookupResponse'
                    }
                ],
                params: [
                    {
                        name: 'appId',
                        type: 'string'
                    }
                ],
                query: [
                    {
                        name: 'term',
                        type: 'string'
                    }
                ]
            }
        ]
    },
    {
        name: 'apps',
        type: [],
        route: 'AppsRoute',
        dependency: {
            importFrom: 'App',
            from: 'App'
        },
        model: 'App',
        microservices: [
            {
                name: 'types',
                method: 'GET',
                path: '/types',
                dependencies: [
                    {
                        importFrom: 'AppType',
                        from: '../enums/AppType'
                    },
                    {
                        importFrom: 'AppFeature',
                        from: '../enums/AppType'
                    },
                ],
                result: 'Record<AppType, AppFeature[]>'
            },
            {
                name: 'test',
                method: 'POST',
                path: '/test',
                dependencies: [],
                result: 'boolean',
                body: 'App'
            },
            {
                name: 'updateApiKey',
                method: 'POST',
                path: '/updateApiKey',
                dependencies: [],
                result: 'boolean'
            }
        ]
    },
    {
        name: 'offSchedule',
        type: [],
        route: 'OffScheduleRoute',
        dependency: {
            importFrom: 'EpisodeCacheDefinition',
            from: '../responses/iplayer/EpisodeCacheTypes'
        },
        model: 'EpisodeCacheDefinition',
        microservices: [
            {
                name: 'refresh',
                method: 'POST',
                path: '/refresh',
                body: 'EpisodeCacheDefinition',
                result: 'boolean'
            }
        ]
    },
    {
        name: 'config',
        type: {},
        route: 'SettingsRoute',
        model: 'string',
        'apiTag': 'Settings'
    },
    {
        name: 'hiddenSettings',
        type: {},
        'customPath': 'json-api/config/hiddenSettings'
    },
    {
        name: 'queue',
        type: [],
        route: 'QueueRoute',
        dependency: {
            importFrom: 'QueueEntryDTO',
            from: 'QueueEntry'
        },
        model: 'QueueEntry'
    },
    {
        name: 'history',
        type: [],
        'storageService': 'historyService',
        dependency: {
            importFrom: 'QueueEntryDTO',
            from: 'QueueEntry'
        },
        model: 'QueueEntry'
    }
]