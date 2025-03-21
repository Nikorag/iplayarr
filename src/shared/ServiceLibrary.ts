
export interface Service {
    name: string,
    type: any,
    customPath?: string,
    route?: string,
    storageService?: string,
    dependency?: {
        importFrom: string,
        from: string
    },
    model?: string,
    apiTag?: string
}

export const ServiceLibrary: Service[] = [
    { name: 'synonyms', type: [], route: 'SynonymsRoute', dependency: { importFrom: 'Synonym', from: 'Synonym' }, model : 'Synonym' },
    { name: 'apps', type: [], route: 'AppsRoute', dependency: { importFrom: 'App', from: 'App' }, model : 'App' },
    { name: 'offSchedule', type: [], route: 'OffScheduleRoute', dependency: { importFrom: 'EpisodeCacheDefinition', from: '../responses/iplayer/EpisodeCacheTypes'}, model : 'EpisodeCacheDefinition' },
    { name: 'config', type: {}, route: 'SettingsRoute', model : 'string', apiTag: 'Settings' },
    { name: 'hiddenSettings', type: {}, customPath: 'json-api/config/hiddenSettings' },
    { name: 'queue', type: [], route: 'QueueRoute', dependency: { importFrom: 'QueueEntryDTO', from: 'QueueEntry' }, model : 'QueueEntry' },
    { name: 'history', type: [], storageService: 'historyService', dependency: { importFrom: 'QueueEntryDTO', from: 'QueueEntry' }, model : 'QueueEntry' }
]
