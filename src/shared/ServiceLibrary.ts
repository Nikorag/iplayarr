// The expectation is that these services provide GET, POST, PUT and DELETE

export interface Service {
    name : string,
    path : string,
    microservices? : {
        [key: string] : ('POST' | 'PUT' | 'GET' | 'DELETE')[]
    },
    initial? : any
}

export const ServiceLibrary : Service[] = [
    {
        name : 'synonyms',
        path : '/synonym',
        microservices : {
            '/searchHistory' : ['GET']
        }
    },
    {
        name : 'apps',
        path : '/apps',
        microservices : {
            '/test' : ['POST'],
            '/types' : ['GET'],
            '/updateApiKey' : ['POST']
        }
    },
    {
        name : 'history',
        path : '/queue/history'
    },
    {
        name : 'queue',
        path : '/queue/queue'
    },
    {
        name : 'offSchedule',
        path : '/offSchedule',
        microservices : {
            '/refresh' : ['POST'],
        }
    },
    {
        name : 'hiddenSettings',
        path : '/config/hiddenSettings',
        initial : {}
    },
]