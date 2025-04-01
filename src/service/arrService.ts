import axios, { AxiosInstance } from 'axios';

import { App } from '../types/App';
import { AppType } from '../types/AppType';
import { ArrCreateDownloadClientRequest, CreateDownloadClientRequestField,createDownloadClientRequestSkeleton } from '../types/requests/arr/CreateDownloadClientRequest';
import { CreateIndexerRequest, createIndexerRequestSkeleton, createIndexRequestFieldsSkeleton } from '../types/requests/arr/CreateIndexerRequest';
import { CreateProwlarrIndexerRequest, createProwlarrIndexerRequestSkeleton } from '../types/requests/arr/CreateProwlarrIndexerRequest';
import { CreateDownloadClientForm } from '../types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../types/requests/form/CreateIndexerForm';
import { ArrLookupResponse } from '../types/responses/arr/ArrLookupResponse';
import { DownloadClientResponse } from '../types/responses/arr/DownloadClientResponse';
import { IndexerResponse } from '../types/responses/arr/IndexerResponse';

export interface ArrConfig {
    API_KEY : string,
    HOST : string,
    DOWNLOAD_CLIENT_ID? : number,
    INDEXER_ID? : number
}

const arrService = {
    createUpdateDownloadClient : async(form : CreateDownloadClientForm, config : ArrConfig, prowlarr : boolean = false, allowCreate : boolean = true) : Promise<number> => {
        const {API_KEY, HOST, DOWNLOAD_CLIENT_ID} = config;
        let updateMethod : keyof AxiosInstance = 'post';

        const createDownloadClientRequest : ArrCreateDownloadClientRequest = {
            ...createDownloadClientRequestSkeleton,
            name : `${form.name} (iPlayarr)`,
            fields : [
                ...createDownloadClientRequestSkeleton.fields as CreateDownloadClientRequestField[],
                {
                    'order': 0,
                    'name': 'host',
                    'label': 'Host',
                    'value': form.host,
                    'type': 'textbox',
                    'advanced': false,
                    'privacy': 'normal',
                    'isFloat': false
                },
                {
                    'order': 1,
                    'name': 'port',
                    'label': 'Port',
                    'value': form.port,
                    'type': 'textbox',
                    'advanced': false,
                    'privacy': 'normal',
                    'isFloat': false
                },
                {
                    'order': 2,
                    'name': 'useSsl',
                    'label': 'Use SSL',
                    'helpText': 'Use secure connection when connection to Sabnzbd',
                    'value': typeof form.useSSL === 'boolean' ? form.useSSL : form.useSSL === 'true',
                    'type': 'checkbox',
                    'advanced': false,
                    'privacy': 'normal',
                    'isFloat': false
                },
                {
                    'order': 4,
                    'name': 'apiKey',
                    'label': 'API Key',
                    'value': form.apiKey,
                    'type': 'textbox',
                    'advanced': false,
                    'privacy': 'apiKey',
                    'isFloat': false
                }
            ]
        } as ArrCreateDownloadClientRequest

        if (prowlarr){
            createDownloadClientRequest.categories = [];
            createDownloadClientRequest.fields = createDownloadClientRequest.fields.filter(({order}) => order != undefined && order < 7);
            createDownloadClientRequest.fields.push(
                {
                    'order': 7,
                    'name': 'category',
                    'label': 'Default Category',
                    'value': 'iplayer',
                    'type': 'textbox',
                    'advanced': false,
                    'privacy': 'normal',
                    'isFloat': false
                },
            )
        }

        if (form.urlBase){
            createDownloadClientRequest.fields.push({
                'order': 3,
                'name': 'urlBase',
                'label': 'URL Base',
                'helpText': 'Adds a prefix to the Sabnzbd url, such as http://[host]:[port]/[urlBase]/api',
                'type': 'textbox',
                'advanced': true,
                'privacy': 'normal',
                'isFloat': false,
                'value' : form.urlBase
            })
        }

        //Find an existing one
        try {
            if (DOWNLOAD_CLIENT_ID){
                const downloadClient = await arrService.getDownloadClient(DOWNLOAD_CLIENT_ID, config, prowlarr);
                if (downloadClient){
                    updateMethod = 'put';
                    createDownloadClientRequest.id = DOWNLOAD_CLIENT_ID;
                } else if (!allowCreate){
                    throw new Error('Existing Download Client not found');
                }
            }

            const url : string = `${HOST}/api/${prowlarr ? 'v1' : 'v3'}/downloadclient?apikey=${API_KEY}`;
            const {data : {id}} = await axios[updateMethod](url, createDownloadClientRequest, {
                headers: {
                    'X-Api-Key': API_KEY
                }
            });

            return id;
        } catch (err){
            throw err;
        }
    },

    getDownloadClient : async(id : number, {API_KEY, HOST} : ArrConfig, prowlarr : boolean) : Promise<DownloadClientResponse | undefined> => {
        const url : string = `${HOST}/api/${prowlarr ? 'v1' : 'v3'}/downloadclient/${id}?apikey=${API_KEY}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key' : API_KEY
                }
            });
            if (response.status !== 200) return;
            const {data} = response;
            const downloadClientResponse : DownloadClientResponse = {
                id : data.id,
                name : data.name,
                host : data.fields.find((field : any) => field.name == 'host').value,
                api_key : data.fields.find((field : any) => field.name == 'apiKey').value,
                port : data.fields.find((field : any) => field.name == 'port').value,
            }
            return downloadClientResponse;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return;
            }
            throw error;
        }
    },

    createUpdateIndexer : async(form : CreateIndexerForm, config : ArrConfig, allowCreate : boolean = true) : Promise<number> => {
        const {API_KEY, HOST, INDEXER_ID} = config;
        let updateMethod : keyof AxiosInstance = 'post';

        const createIndexerRequest : CreateIndexerRequest = {
            ...createIndexerRequestSkeleton,
            priority : form.priority || 25,
            name : `${form.name} (iPlayarr)`,
            downloadClientId : form.downloadClientId,
            fields : [
                ...createIndexRequestFieldsSkeleton,
                {
                    'order': 0,
                    'name': 'baseUrl',
                    'label': 'URL',
                    'value': form.url,
                    'type': 'textbox',
                    'advanced': false,
                    'privacy': 'normal',
                    'isFloat': false
                },
                {
                    'order': 1,
                    'name': 'apiPath',
                    'label': 'API Path',
                    'helpText': 'Path to the api, usually /api',
                    'value': `${form.urlBase || '/api'}`,
                    'type': 'textbox',
                    'advanced': true,
                    'privacy': 'normal',
                    'isFloat': false
                },
                {
                    'order': 2,
                    'name': 'apiKey',
                    'label': 'API Key',
                    'value': form.apiKey,
                    'type': 'textbox',
                    'advanced': false,
                    'privacy': 'apiKey',
                    'isFloat': false
                },
                {
                    'order': 3,
                    'name': 'categories',
                    'label': 'Categories',
                    'helpText': 'Drop down list, leave blank to disable standard/daily shows',
                    'value': form.categories,
                    'type': 'select',
                    'advanced': false,
                    'selectOptionsProviderAction': 'newznabCategories',
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
                    'isFloat': false,
                    'value': `&app=${form.appId}`,
                },
            ]
        } as CreateIndexerRequest;

        //Find an existing one
        if (INDEXER_ID){
            const indexer = await arrService.getIndexer(INDEXER_ID, config);
            if (indexer){
                updateMethod = 'put';
                createIndexerRequest.id = INDEXER_ID;
            } else if (!allowCreate){
                throw new Error('Existing Download Client not found');
            }
        }

        const url : string = `${HOST}/api/v3/indexer?apikey=${API_KEY}`;
        try {
            const {data : {id}} = await axios[updateMethod](url, createIndexerRequest, {
                headers: {
                    'X-Api-Key': API_KEY
                }
            });

            return id;
        } catch (err){
            throw err;
        }
    },

    getIndexer : async(id : number, {API_KEY, HOST} : ArrConfig, prowlarr : boolean = false) : Promise<IndexerResponse | undefined> => {
        const url : string = `${HOST}/api/${prowlarr ? 'v1' : 'v3'}/indexer/${id}?apikey=${API_KEY}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key' : API_KEY
                }
            });
            if (response.status !== 200) return;
            const {data} = response;
            const indexerResponse : IndexerResponse = {
                id : data.id,
                name : data.name,
                url : data.fields.find((field : any) => field.name == 'baseUrl').value,
                api_key : data.fields.find((field : any) => field.name == 'apiKey').value
            }
            return indexerResponse;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return;
            }
            throw error;
        }
    },

    createUpdateProwlarrIndexer : async(form : CreateIndexerForm, config : ArrConfig, allowCreate : boolean = true) : Promise<number> => {
        const {API_KEY, HOST, INDEXER_ID} = config;
        let updateMethod : keyof AxiosInstance = 'post';

        const createIndexerRequest : CreateProwlarrIndexerRequest = {
            ...createProwlarrIndexerRequestSkeleton,
            priority : form.priority || 25,
            added : new Date(),
            indexerUrls : [
                form.url
            ],
            name : `${form.name} (iPlayarr)`,
            downloadClientId : form.downloadClientId,
            fields : [
                ...createIndexRequestFieldsSkeleton,
                {
                    'order': 0,
                    'name': 'baseUrl',
                    'label': 'URL',
                    'value': form.url,
                    'type': 'textbox',
                    'advanced': false,
                    'privacy': 'normal',
                    'isFloat': false
                },
                {
                    'order': 1,
                    'name': 'apiPath',
                    'label': 'API Path',
                    'helpText': 'Path to the api, usually /api',
                    'value': `${form.urlBase || '/api'}`,
                    'type': 'textbox',
                    'advanced': true,
                    'privacy': 'normal',
                    'isFloat': false
                },
                {
                    'order': 2,
                    'name': 'apiKey',
                    'label': 'API Key',
                    'value': form.apiKey,
                    'type': 'textbox',
                    'advanced': false,
                    'privacy': 'apiKey',
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
                    'isFloat': false,
                    'value': `&app=${form.appId}`,
                },
            ]
        } as CreateProwlarrIndexerRequest;

        //Find an existing one
        if (INDEXER_ID){
            const indexer = await arrService.getIndexer(INDEXER_ID, config, true);
            if (indexer){
                updateMethod = 'put';
                createIndexerRequest.id = INDEXER_ID;
            } else if (!allowCreate){
                throw new Error('Existing Download Client not found');
            }
        }

        const url : string = `${HOST}/api/v1/indexer?apikey=${API_KEY}`;
        try {
            const {data : {id}} = await axios[updateMethod](url, createIndexerRequest, {
                headers: {
                    'X-Api-Key': API_KEY
                }
            });

            return id;
        } catch (err){
            throw err;
        }
    },

    testConnection : async({API_KEY, HOST} : ArrConfig) : Promise<string | boolean> => {
        const url : string = `${HOST}/api?apikey=${API_KEY}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key' : API_KEY
                }
            });
            if (response.status == 200) return true;
            return false;
        } catch (error) {
            if (axios.isAxiosError(error)){
                return error.message;
            }
            return false;
        }
    },

    search : async(app : App, term? : string) : Promise<ArrLookupResponse[]> => {
        const endpoint : string = app.type == AppType.SONARR ? 'series' : 'movie';
        const url : string = `${app.url}/api/v3/${endpoint}${term ? `/lookup?term=${term}` : ''}`

        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Api-Key' : app.api_key
                }
            });
            if (response.status == 200) {
                const results : ArrLookupResponse[] = response.data;
                return results.filter(({path}) => path);
            }
            return [];
        } catch (error) {
            throw error;
        }
    }
}

export default arrService;