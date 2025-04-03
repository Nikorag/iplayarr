// The expectation is that these services provide GET, POST, PUT and DELETE

export interface Service {
    name : string,
    path : string,
    microservices? : {
        [key: string] : ('POST' | 'PUT' | 'GET' | 'DELETE')[]
    }
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
    }
]