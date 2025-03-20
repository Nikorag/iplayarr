import { CreateIndexerRequestField } from './CreateIndexerRequest';

export interface CreateProwlarrIndexerRequest {
    indexerUrls : string[],
    legacyUrls : string[],
    definitionName: string,
    description: string,
    language: string,
    encoding: string,
    enable: boolean,
    redirect: boolean,
    supportsRedirect: boolean,
    supportsPagination: boolean,
    appProfileId: number,
    privacy: string,
    added: Date,
    sortName: string,
    capabilities: ProwlarrIndexerCapabilities,

    supportsRss: boolean,
    supportsSearch: boolean,
    protocol: string,
    priority: number,
    downloadClientId: number,
    name: string,
    fields : CreateIndexerRequestField[],
    implementationName: string,
    implementation: string,
    configContract: string,
    infoLink: string,
    tags: string[],
    id?: number
}

export interface ProwlarrIndexerCapabilities {
    limitsMax : number,
    limitsDefault : number,
    categories : ProwlarrIndexerCategory[],
    supportsRawSearch: boolean,
    searchParams: string[]
    tvSearchParams: string[],
    movieSearchParams: string[],
    musicSearchParams: string[],
    bookSearchParams: string[]
}

export interface ProwlarrIndexerCategory {
    id : number,
    name : string,
    subCategories : ProwlarrIndexerCategory[]
}

export const createProwlarrIndexerRequestSkeleton : Partial<CreateProwlarrIndexerRequest> = {
    'legacyUrls': [],
    'definitionName': 'Newznab',
    'description': 'Newznab is an API search specification for Usenet',
    'language': 'en-US',
    'encoding': 'Unicode (UTF-8)',
    'enable': true,
    'redirect': false,
    'supportsRss': true,
    'supportsSearch': true,
    'supportsRedirect': true,
    'supportsPagination': true,
    'appProfileId': 1,
    'protocol': 'usenet',
    'privacy': 'private',
    'capabilities': {
        'limitsMax': 100,
        'limitsDefault': 100,
        'categories': [
            {
                'id': 0,
                'name': 'Other',
                'subCategories': []
            },
            {
                'id': 100000,
                'name': 'Other',
                'subCategories': []
            },
            {
                'id': 2000,
                'name': 'Movies',
                'subCategories': [
                    {
                        'id': 2010,
                        'name': 'Movies/Foreign',
                        'subCategories': []
                    },
                    {
                        'id': 2020,
                        'name': 'Movies/Other',
                        'subCategories': []
                    },
                    {
                        'id': 2030,
                        'name': 'Movies/SD',
                        'subCategories': []
                    },
                    {
                        'id': 2040,
                        'name': 'Movies/HD',
                        'subCategories': []
                    },
                    {
                        'id': 2050,
                        'name': 'Movies/BluRay',
                        'subCategories': []
                    },
                    {
                        'id': 2060,
                        'name': 'Movies/3D',
                        'subCategories': []
                    }
                ]
            },
            {
                'id': 102010,
                'name': 'Movies/Movies/Foreign',
                'subCategories': []
            },
            {
                'id': 102020,
                'name': 'Movies/Movies/Other',
                'subCategories': []
            },
            {
                'id': 102030,
                'name': 'Movies/Movies/SD',
                'subCategories': []
            },
            {
                'id': 102040,
                'name': 'Movies/Movies/HD',
                'subCategories': []
            },
            {
                'id': 102050,
                'name': 'Movies/Movies/BluRay',
                'subCategories': []
            },
            {
                'id': 102060,
                'name': 'Movies/Movies/3D',
                'subCategories': []
            },
            {
                'id': 102000,
                'name': 'Movies',
                'subCategories': []
            },
            {
                'id': 5000,
                'name': 'TV',
                'subCategories': [
                    {
                        'id': 5040,
                        'name': 'TV/HD',
                        'subCategories': []
                    }
                ]
            },
            {
                'id': 105040,
                'name': 'TV/TV/HD',
                'subCategories': []
            },
            {
                'id': 105000,
                'name': 'TV',
                'subCategories': []
            }
        ],
        'supportsRawSearch': false,
        'searchParams': [
            'q'
        ],
        'tvSearchParams': [
            'q',
            'season',
            'ep'
        ],
        'movieSearchParams': [
            'q'
        ],
        'musicSearchParams': [],
        'bookSearchParams': []
    },
    'downloadClientId': 3,
    'sortName': 'iplayer',
    'name': 'iPlayer',
    'implementationName': 'Newznab',
    'implementation': 'Newznab',
    'configContract': 'NewznabSettings',
    'infoLink': 'https://wiki.servarr.com/prowlarr/supported-indexers#newznab',
    'tags': []
}