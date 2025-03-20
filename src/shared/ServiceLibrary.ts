
export interface Service {
    name : string,
    type : any,
    customPath? : string,
    route? : string,
    storageService? : string
}

export const ServiceLibrary : Service[]  = [
    { name : 'synonyms', type : [], route : 'SynonymsRoute'  },
    { name : 'apps', type : [], route : 'AppsRoute'},
    { name : 'offSchedule', type : [], route : 'OffScheduleRoute'},
    { name : 'config', type : {}, route : 'SettingsRoute'},
    { name : 'hiddenSettings', type : {}, customPath : 'json-api/config/hiddenSettings'},
    { name : 'queue', type : [], route : 'QueueRoute'},
    { name : 'history', type : [], storageService : 'historyService'}
]
