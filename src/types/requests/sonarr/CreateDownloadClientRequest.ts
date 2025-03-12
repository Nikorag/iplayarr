export const createDownloadClientRequestSkeleton : Partial<ArrCreateDownloadClientRequest> = {
    'enable': true,
    'protocol': 'usenet',
    'priority': 1,
    'removeCompletedDownloads': true,
    'removeFailedDownloads': true,
    'fields': [
        {
            'order': 5,
            'name': 'username',
            'label': 'Username',
            'type': 'textbox',
            'advanced': false,
            'privacy': 'userName',
            'isFloat': false
        },
        {
            'order': 6,
            'name': 'password',
            'label': 'Password',
            'type': 'password',
            'advanced': false,
            'privacy': 'password',
            'isFloat': false
        },
        {
            'order': 7,
            'name': 'tvCategory',
            'label': 'Category',
            'helpText': 'Adding a category specific to Sonarr avoids conflicts with unrelated non-Sonarr downloads. Using a category is optional, but strongly recommended.',
            'value': 'iplayer',
            'type': 'textbox',
            'advanced': false,
            'privacy': 'normal',
            'isFloat': false
        },
        {
            'order': 8,
            'name': 'movieCategory',
            'label': 'Category',
            'helpText': 'Adding a category specific to Sonarr avoids conflicts with unrelated non-Sonarr downloads. Using a category is optional, but strongly recommended.',
            'value': 'iplayer',
            'type': 'textbox',
            'advanced': false,
            'privacy': 'normal',
            'isFloat': false
        },
        {
            'order': 9,
            'name': 'recentTvPriority',
            'label': 'Recent Priority',
            'helpText': 'Priority to use when grabbing episodes that aired within the last 14 days',
            'value': -100,
            'type': 'select',
            'advanced': false,
            'selectOptions': [
                {
                    'value': -100,
                    'name': 'Default',
                    'order': -100
                },
                {
                    'value': -2,
                    'name': 'Paused',
                    'order': -2
                },
                {
                    'value': -1,
                    'name': 'Low',
                    'order': -1
                },
                {
                    'value': 0,
                    'name': 'Normal',
                    'order': 0
                },
                {
                    'value': 1,
                    'name': 'High',
                    'order': 1
                },
                {
                    'value': 2,
                    'name': 'Force',
                    'order': 2
                }
            ],
            'privacy': 'normal',
            'isFloat': false
        },
        {
            'order': 10,
            'name': 'olderTvPriority',
            'label': 'Older Priority',
            'helpText': 'Priority to use when grabbing episodes that aired over 14 days ago',
            'value': -100,
            'type': 'select',
            'advanced': false,
            'selectOptions': [
                {
                    'value': -100,
                    'name': 'Default',
                    'order': -100
                },
                {
                    'value': -2,
                    'name': 'Paused',
                    'order': -2
                },
                {
                    'value': -1,
                    'name': 'Low',
                    'order': -1
                },
                {
                    'value': 0,
                    'name': 'Normal',
                    'order': 0
                },
                {
                    'value': 1,
                    'name': 'High',
                    'order': 1
                },
                {
                    'value': 2,
                    'name': 'Force',
                    'order': 2
                }
            ],
            'privacy': 'normal',
            'isFloat': false
        }
    ],
    'implementationName': 'SABnzbd',
    'implementation': 'Sabnzbd',
    'configContract': 'SabnzbdSettings',
    'infoLink': 'https://wiki.servarr.com/sonarr/supported#sabnzbd',
    'tags': [],
    'id': 0
}

export interface ArrCreateDownloadClientRequest {
    id: number,
    name: string,
    fields: CreateDownloadClientRequestField[],
    implementationName: string,
    implementation: string,
    configContract: string,
    infoLink: string,
    tags: string[],
    enable: boolean,
    protocol: string,
    priority: number,
    removeCompletedDownloads: boolean,
    removeFailedDownloads: boolean
}

export interface CreateDownloadClientRequestField {
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
    selectOptions?: CreateDownloadClientRequestFieldOption[],
    selectOptionsProviderAction?: string,
    section?: string
    hidden?: string,
    privacy?: string,
    placeholder?: string,
    isFloat?: boolean
}

export interface CreateDownloadClientRequestFieldOption {
    value : number,
    name : string,
    order : number,
    hint? : string
}