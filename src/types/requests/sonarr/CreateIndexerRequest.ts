export interface CreateIndexerRequest {
    enableRss: boolean,
    enableAutomaticSearch: boolean,
    enableInteractiveSearch: boolean,
    supportsRss: boolean,
    supportsSearch: boolean,
    protocol: string,
    priority: number,
    seasonSearchMaximumSingleEpisodeAge: number,
    downloadClientId: number,
    name: string,
    fields : CreateIndexerRequestField[],
    implementationName: string,
    implementation: string,
    configContract: string,
    infoLink: string,
    tags: string[],
    id: number
}

export interface CreateIndexerRequestField {
    order?: number,
    name?: string,
    label?: string,
    unit?: string,
    helpText?: string,
    helpTextWarning?: string,
    helpLink?: string,
    value?: any,
    type?: string,
    advanced?: boolean,
    selectOptions?: CreateIndexerRequestFieldOption[],
    selectOptionsProviderAction?: string,
    section?: string
    hidden?: string,
    privacy?: string,
    placeholder?: string,
    isFloat?: boolean
}

export interface CreateIndexerRequestFieldOption {
    value : number,
    name : string,
    order : number,
    hint? : string
}

export const createIndexerRequestSkeleton : Partial<CreateIndexerRequest> = {
    'enableRss': true,
    'enableAutomaticSearch': true,
    'enableInteractiveSearch': true,
    'supportsRss': true,
    'supportsSearch': true,
    'protocol': 'usenet',
    'priority': 25,
    'seasonSearchMaximumSingleEpisodeAge': 0,
    'downloadClientId': 3,
    'name': 'iPlayer',
    'implementationName': 'Newznab',
    'implementation': 'Newznab',
    'configContract': 'NewznabSettings',
    'infoLink': 'https://wiki.servarr.com/sonarr/supported#newznab',
    'tags': [],
    'id': 0
}

export const createIndexRequestFieldsSkeleton : CreateIndexerRequestField[] = [
    {
        'order': 4,
        'name': 'animeCategories',
        'label': 'Anime Categories',
        'helpText': 'Drop down list, leave blank to disable anime',
        'value': [],
        'type': 'select',
        'advanced': false,
        'selectOptionsProviderAction': 'newznabCategories',
        'privacy': 'normal',
        'isFloat': false
    },
    {
        'order': 5,
        'name': 'animeStandardFormatSearch',
        'label': 'Anime Standard Format Search',
        'helpText': 'Also search for anime using the standard numbering',
        'value': false,
        'type': 'checkbox',
        'advanced': false,
        'privacy': 'normal',
        'isFloat': false
    },
    {
        'order': 6,
        'name': 'additionalParameters',
        'label': 'Additional Parameters',
        'helpText': 'Please note if you change the category you will have to add required/restricted rules about the subgroups to avoid foreign language releases.',
        'type': 'textbox',
        'advanced': true,
        'privacy': 'normal',
        'isFloat': false
    },
    {
        'order': 7,
        'name': 'multiLanguages',
        'label': 'Multi Languages',
        'helpText': 'What languages are normally in a multi release on this indexer?',
        'value': [],
        'type': 'select',
        'advanced': true,
        'selectOptions': [
            {
                'value': -2,
                'name': 'Original',
                'order': 0
            },
            {
                'value': 26,
                'name': 'Arabic',
                'order': 0
            },
            {
                'value': 41,
                'name': 'Bosnian',
                'order': 0
            },
            {
                'value': 28,
                'name': 'Bulgarian',
                'order': 0
            },
            {
                'value': 38,
                'name': 'Catalan',
                'order': 0
            },
            {
                'value': 10,
                'name': 'Chinese',
                'order': 0
            },
            {
                'value': 39,
                'name': 'Croatian',
                'order': 0
            },
            {
                'value': 25,
                'name': 'Czech',
                'order': 0
            },
            {
                'value': 6,
                'name': 'Danish',
                'order': 0
            },
            {
                'value': 7,
                'name': 'Dutch',
                'order': 0
            },
            {
                'value': 1,
                'name': 'English',
                'order': 0
            },
            {
                'value': 42,
                'name': 'Estonian',
                'order': 0
            },
            {
                'value': 16,
                'name': 'Finnish',
                'order': 0
            },
            {
                'value': 19,
                'name': 'Flemish',
                'order': 0
            },
            {
                'value': 2,
                'name': 'French',
                'order': 0
            },
            {
                'value': 4,
                'name': 'German',
                'order': 0
            },
            {
                'value': 20,
                'name': 'Greek',
                'order': 0
            },
            {
                'value': 23,
                'name': 'Hebrew',
                'order': 0
            },
            {
                'value': 27,
                'name': 'Hindi',
                'order': 0
            },
            {
                'value': 22,
                'name': 'Hungarian',
                'order': 0
            },
            {
                'value': 9,
                'name': 'Icelandic',
                'order': 0
            },
            {
                'value': 44,
                'name': 'Indonesian',
                'order': 0
            },
            {
                'value': 5,
                'name': 'Italian',
                'order': 0
            },
            {
                'value': 8,
                'name': 'Japanese',
                'order': 0
            },
            {
                'value': 21,
                'name': 'Korean',
                'order': 0
            },
            {
                'value': 36,
                'name': 'Latvian',
                'order': 0
            },
            {
                'value': 24,
                'name': 'Lithuanian',
                'order': 0
            },
            {
                'value': 45,
                'name': 'Macedonian',
                'order': 0
            },
            {
                'value': 29,
                'name': 'Malayalam',
                'order': 0
            },
            {
                'value': 15,
                'name': 'Norwegian',
                'order': 0
            },
            {
                'value': 37,
                'name': 'Persian',
                'order': 0
            },
            {
                'value': 12,
                'name': 'Polish',
                'order': 0
            },
            {
                'value': 18,
                'name': 'Portuguese',
                'order': 0
            },
            {
                'value': 33,
                'name': 'Portuguese (Brazil)',
                'order': 0
            },
            {
                'value': 35,
                'name': 'Romanian',
                'order': 0
            },
            {
                'value': 11,
                'name': 'Russian',
                'order': 0
            },
            {
                'value': 40,
                'name': 'Serbian',
                'order': 0
            },
            {
                'value': 31,
                'name': 'Slovak',
                'order': 0
            },
            {
                'value': 46,
                'name': 'Slovenian',
                'order': 0
            },
            {
                'value': 3,
                'name': 'Spanish',
                'order': 0
            },
            {
                'value': 34,
                'name': 'Spanish (Latino)',
                'order': 0
            },
            {
                'value': 14,
                'name': 'Swedish',
                'order': 0
            },
            {
                'value': 43,
                'name': 'Tamil',
                'order': 0
            },
            {
                'value': 32,
                'name': 'Thai',
                'order': 0
            },
            {
                'value': 17,
                'name': 'Turkish',
                'order': 0
            },
            {
                'value': 30,
                'name': 'Ukrainian',
                'order': 0
            },
            {
                'value': 13,
                'name': 'Vietnamese',
                'order': 0
            }
        ],
        'privacy': 'normal',
        'isFloat': false
    },
    {
        'order': 8,
        'name': 'failDownloads',
        'label': 'Fail Downloads',
        'helpText': 'While processing completed downloads Sonarr will treat these selected filetypes as failed downloads.',
        'value': [],
        'type': 'select',
        'advanced': true,
        'selectOptions': [
            {
                'value': 0,
                'name': 'Executables',
                'order': 7,
                'hint': '(0)'
            },
            {
                'value': 1,
                'name': 'Potentially Dangerous',
                'order': 10,
                'hint': '(1)'
            }
        ],
        'privacy': 'normal',
        'isFloat': false
    }
]