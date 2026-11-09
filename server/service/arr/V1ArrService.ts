import { App } from '../../types/App';
import { AbstractCreateIndexerRequest } from '../../types/requests/arr/AbstractCreateIndexerRequest';
import { ArrCreateDownloadClientRequest } from '../../types/requests/arr/CreateDownloadClientRequest';
import { createIndexRequestFieldsSkeleton } from '../../types/requests/arr/CreateIndexerRequest';
import { CreateProwlarrIndexerRequest, createProwlarrIndexerRequestSkeleton } from '../../types/requests/arr/CreateProwlarrIndexerRequest';
import { CreateDownloadClientForm } from '../../types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../../types/requests/form/CreateIndexerForm';
import { V3ArrService } from './V3ArrService';

class V1ArrService extends V3ArrService {
    constructor() {
        super();
    }

    getApiUrl(app: App): string {
        return `${app.url}/api/v1`;
    }

    createDownloadClientRequestObject(form: CreateDownloadClientForm, tags: number[]): ArrCreateDownloadClientRequest {
        const createDownloadClientRequest: ArrCreateDownloadClientRequest = super.createDownloadClientRequestObject(form, tags);

        createDownloadClientRequest.categories = [];
        createDownloadClientRequest.fields = createDownloadClientRequest.fields.filter(
            ({ order }) => order != undefined && order < 7
        );
        createDownloadClientRequest.fields.push({
            order: 7,
            name: 'category',
            label: 'Default Category',
            value: 'iplayer',
            type: 'textbox',
            advanced: false,
            privacy: 'normal',
            isFloat: false,
        });

        return createDownloadClientRequest;
    }

    createIndexerRequestObject(form: CreateIndexerForm): AbstractCreateIndexerRequest {
        return {
            ...createProwlarrIndexerRequestSkeleton,
            priority: form.priority || 25,
            added: new Date(),
            indexerUrls: [form.url],
            name: `${form.name} (iPlayarr)`,
            downloadClientId: form.downloadClientId,
            fields: [
                ...createIndexRequestFieldsSkeleton,
                {
                    order: 0,
                    name: 'baseUrl',
                    label: 'URL',
                    value: form.url,
                    type: 'textbox',
                    advanced: false,
                    privacy: 'normal',
                    isFloat: false,
                },
                {
                    order: 1,
                    name: 'apiPath',
                    label: 'API Path',
                    helpText: 'Path to the api, usually /api',
                    value: `${form.urlBase || '/api'}`,
                    type: 'textbox',
                    advanced: true,
                    privacy: 'normal',
                    isFloat: false,
                },
                {
                    order: 2,
                    name: 'apiKey',
                    label: 'API Key',
                    value: form.apiKey,
                    type: 'textbox',
                    advanced: false,
                    privacy: 'apiKey',
                    isFloat: false,
                },
                {
                    order: 6,
                    name: 'additionalParameters',
                    label: 'Additional Parameters',
                    helpText:
                        'Please note if you change the category you will have to add required/restricted rules about the subgroups to avoid foreign language releases.',
                    type: 'textbox',
                    advanced: true,
                    privacy: 'normal',
                    isFloat: false,
                    value: `&app=${form.appId}`,
                },
            ],
        } as CreateProwlarrIndexerRequest;
    }
}

export default new V1ArrService();