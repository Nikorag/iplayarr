import axios, { AxiosInstance } from 'axios';

import { App } from '../../types/App';
import { AppType } from '../../types/AppType';
import { AbstractCreateIndexerRequest } from '../../types/requests/arr/AbstractCreateIndexerRequest';
import { ArrCreateDownloadClientRequest, CreateDownloadClientRequestField, createDownloadClientRequestSkeleton } from '../../types/requests/arr/CreateDownloadClientRequest';
import { CreateIndexerRequest, createIndexerRequestSkeleton, createIndexRequestFieldsSkeleton } from '../../types/requests/arr/CreateIndexerRequest';
import { CreateDownloadClientForm } from '../../types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../../types/requests/form/CreateIndexerForm';
import { ArrLookupResponse } from '../../types/responses/arr/ArrLookupResponse';
import { DownloadClientResponse } from '../../types/responses/arr/DownloadClientResponse';
import { IndexerResponse } from '../../types/responses/arr/IndexerResponse';
import { formatArrError } from '../../utils/arrError';
import AbstractArrService, { ArrTag } from './AbstractArrService';

export class V3ArrService implements AbstractArrService {
    /** Skeleton download client fields that belong to a different app and so are not sent */
    protected excludedDownloadClientFields: string[] = ['movieCategory'];

    async search(app: App, term?: string): Promise<ArrLookupResponse[]> {
        const endpoint: string = app.type == AppType.SONARR ? 'series' : 'movie';
        const url: string = `${this.getApiUrl(app)}/${endpoint}${term ? `/lookup?term=${term}` : ''}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key': app.api_key,
                },
            });
            if (response.status == 200) {
                const results: ArrLookupResponse[] = response.data;
                return results.filter(({ path }) => path);
            }
            return [];
        } catch (error) {
            throw error;
        }
    }

    async upsertIndexer(form: CreateIndexerForm, app: App, allowCreate: boolean = true): Promise<number> {
        let updateMethod: keyof AxiosInstance = 'post';
        const tags = await this.getTagDefsForForm(app, form.tags);

        const createIndexerRequest = this.createIndexerRequestObject(form, tags);

        //Find an existing one
        if (app.indexer?.id) {
            const indexer = await this.getIndexer(app);
            if (indexer) {
                updateMethod = 'put';
                createIndexerRequest.id = app.indexer.id;
            } else if (!allowCreate) {
                throw new Error('Existing Indexer not found');
            }
        }

        const url: string = `${this.getApiUrl(app)}/indexer`;
        try {
            const {
                data: { id },
            } = await axios[updateMethod](url, createIndexerRequest, {
                headers: {
                    'X-Api-Key': app.api_key,
                },
            });

            return id;
        } catch (err) {
            throw new Error(formatArrError(err));
        }
    }

    createIndexerRequestObject(form: CreateIndexerForm, tags: number[]): AbstractCreateIndexerRequest {
        return {
            ...createIndexerRequestSkeleton,
            priority: form.priority || 25,
            name: `${form.name} (iPlayarr)`,
            downloadClientId: form.downloadClientId,
            tags,
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
                    order: 3,
                    name: 'categories',
                    label: 'Categories',
                    helpText: 'Drop down list, leave blank to disable standard/daily shows',
                    value: form.categories,
                    type: 'select',
                    advanced: false,
                    selectOptionsProviderAction: 'newznabCategories',
                    privacy: 'normal',
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
        } as CreateIndexerRequest;
    }


    async getIndexer(app: App): Promise<IndexerResponse | undefined> {
        const url: string = `${this.getApiUrl(app)}/indexer/${app.indexer?.id}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key': app.api_key,
                },
            });
            if (response.status !== 200) return;
            const { data } = response;
            const indexerResponse: IndexerResponse = {
                id: data.id,
                name: data.name,
                url: data.fields.find((field: any) => field.name == 'baseUrl').value,
                api_key: data.fields.find((field: any) => field.name == 'apiKey').value,
            };
            return indexerResponse;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return;
            }
            throw new Error(formatArrError(error));
        }
    }



    async testConnection(app: App): Promise<boolean | string> {
        const url: string = `${this.getApiUrl(app)}/system/status`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key': app.api_key,
                },
            });
            if (response.status == 200) return true;
            return `Unexpected response status ${response.status}`;
        } catch (error) {
            return formatArrError(error);
        }
    }

    async getTags(app: App): Promise<ArrTag[]> {
        const url: string = `${this.getApiUrl(app)}/tag`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key': app.api_key,
                },
            });
            if (response.status == 200) return response.data;
            return [];
        } catch (error) {
            throw new Error(`Unable to load tags: ${formatArrError(error)}`);
        }
    }

    async createTag(app: App, label: string): Promise<ArrTag | undefined> {
        const url: string = `${this.getApiUrl(app)}/tag`;

        try {
            const response = await axios.post(
                url,
                { label },
                {
                    headers: {
                        'X-Api-Key': app.api_key,
                    },
                }
            );
            return response.data;
        } catch (error) {
            throw new Error(`Unable to create tag '${label}': ${formatArrError(error)}`);
        }
    }

    getApiUrl(app: App): string {
        return `${app.url}/api/v3`;
    }

    async upsertDownloadClient(form: CreateDownloadClientForm, app: App, allowCreate: boolean = true): Promise<number> {
        let updateMethod: keyof AxiosInstance = 'post';

        const tags = await this.getTagDefsForForm(app, form.tags);
        const createDownloadClientRequest = this.createDownloadClientRequestObject(form, tags);

        //Find an existing one
        try {
            if (app.download_client?.id) {
                const downloadClient = await this.getDownloadClient(app);
                if (downloadClient) {
                    updateMethod = 'put';
                    createDownloadClientRequest.id = app.download_client?.id;
                } else if (!allowCreate) {
                    throw new Error('Existing Download Client not found');
                }
            }

            const url: string = `${this.getApiUrl(app)}/downloadclient`;
            const {
                data: { id },
            } = await axios[updateMethod](url, createDownloadClientRequest, {
                headers: {
                    'X-Api-Key': app.api_key,
                },
            });

            return id;
        } catch (err) {
            throw new Error(formatArrError(err));
        }
    }

    async deleteDownloadClient(app: App, id: number): Promise<void> {
        try {
            await axios.delete(`${this.getApiUrl(app)}/downloadclient/${id}`, {
                headers: {
                    'X-Api-Key': app.api_key,
                },
            });
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 404) return;
            throw new Error(formatArrError(err));
        }
    }

    async getDownloadClient(app: App): Promise<DownloadClientResponse | undefined> {
        const url: string = `${this.getApiUrl(app)}/downloadclient/${app.download_client?.id}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key': app.api_key,
                },
            });
            if (response.status !== 200) return;
            const { data } = response;
            const downloadClientResponse: DownloadClientResponse = {
                id: data.id,
                name: data.name,
                host: data.fields.find((field: any) => field.name == 'host').value,
                api_key: data.fields.find((field: any) => field.name == 'apiKey').value,
                port: data.fields.find((field: any) => field.name == 'port').value,
            };
            return downloadClientResponse;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return;
            }
            throw new Error(formatArrError(error));
        }
    }

    createDownloadClientRequestObject(form: CreateDownloadClientForm, tags: number[]): ArrCreateDownloadClientRequest {
        const createDownloadClientRequest: ArrCreateDownloadClientRequest = {
            ...createDownloadClientRequestSkeleton,
            name: `${form.name} (iPlayarr)`,
            tags,
            fields: [
                ...(createDownloadClientRequestSkeleton.fields as CreateDownloadClientRequestField[]).filter(
                    ({ name }) => !this.excludedDownloadClientFields.includes(name as string)
                ),
                {
                    order: 0,
                    name: 'host',
                    label: 'Host',
                    value: form.host,
                    type: 'textbox',
                    advanced: false,
                    privacy: 'normal',
                    isFloat: false,
                },
                {
                    order: 1,
                    name: 'port',
                    label: 'Port',
                    value: form.port,
                    type: 'textbox',
                    advanced: false,
                    privacy: 'normal',
                    isFloat: false,
                },
                {
                    order: 2,
                    name: 'useSsl',
                    label: 'Use SSL',
                    helpText: 'Use secure connection when connection to Sabnzbd',
                    value: typeof form.useSSL === 'boolean' ? form.useSSL : form.useSSL === 'true',
                    type: 'checkbox',
                    advanced: false,
                    privacy: 'normal',
                    isFloat: false,
                },
                {
                    order: 4,
                    name: 'apiKey',
                    label: 'API Key',
                    value: form.apiKey,
                    type: 'textbox',
                    advanced: false,
                    privacy: 'apiKey',
                    isFloat: false,
                },
            ],
        } as ArrCreateDownloadClientRequest;

        if (form.urlBase) {
            createDownloadClientRequest.fields.push({
                order: 3,
                name: 'urlBase',
                label: 'URL Base',
                helpText: 'Adds a prefix to the Sabnzbd url, such as http://[host]:[port]/[urlBase]/api',
                type: 'textbox',
                advanced: true,
                privacy: 'normal',
                isFloat: false,
                value: form.urlBase,
            });
        }

        return createDownloadClientRequest;
    }


    async getTagDefsForForm(app: App, formTags: string[]): Promise<number[]> {
        const tags: number[] = [];
        if (formTags.length > 0) {
            const remoteTags = await this.getTags(app);
            for (const tag of formTags) {
                const remoteTag = remoteTags.find(({ label }) => label.toLowerCase() == tag.toLowerCase());
                if (remoteTag) {
                    tags.push(remoteTag.id);
                } else {
                    const newTag = await this.createTag(app, tag);
                    if (newTag) {
                        tags.push(newTag.id);
                    }
                }
            }
        }
        return tags;
    }
}

export default new V3ArrService();