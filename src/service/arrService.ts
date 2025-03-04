import axios, { AxiosInstance } from "axios";
import { IplayarrParameter } from "../types/IplayarrParameters";
import { CreateDownloadClientForm } from "../types/requests/form/CreateDownloadClientForm";
import { ArrCreateDownloadClientRequest, createDownloadClientRequestSkeleton, CreateDownloadClientRequestField } from "../types/requests/sonarr/CreateDownloadClientRequest";
import { setParameter } from "./configService";
import { DownloadClientResponse } from "../types/responses/arr/DownloadClientResponse";
import { CreateIndexerForm } from "../types/requests/form/CreateIndexerForm";
import { CreateIndexerRequest, createIndexerRequestSkeleton, createIndexRequestFieldsSkeleton } from "../types/requests/sonarr/CreateIndexerRequest";
import { IndexerResponse } from "../types/responses/arr/IndexerResponse";

export interface ArrConfig {
    API_KEY : string,
    HOST : string,
    DOWNLOAD_CLIENT_ID? : number,
    INDEXER_ID? : number
}

const arrService = {
    createUpdateDownloadClient : async(form : CreateDownloadClientForm, config : ArrConfig, download_id_key : IplayarrParameter) : Promise<number> => {
        const {API_KEY, HOST, DOWNLOAD_CLIENT_ID} = config;
        let updateMethod : keyof AxiosInstance = 'post';

        const createDownloadClientRequest : ArrCreateDownloadClientRequest = {
            ...createDownloadClientRequestSkeleton,
            name : form.name,
            fields : [
                ...createDownloadClientRequestSkeleton.fields as CreateDownloadClientRequestField[],
                {
                    "order": 0,
                    "name": "host",
                    "label": "Host",
                    "value": form.host,
                    "type": "textbox",
                    "advanced": false,
                    "privacy": "normal",
                    "isFloat": false
                },
                {
                    "order": 1,
                    "name": "port",
                    "label": "Port",
                    "value": form.port,
                    "type": "textbox",
                    "advanced": false,
                    "privacy": "normal",
                    "isFloat": false
                },
                {
                    "order": 2,
                    "name": "useSsl",
                    "label": "Use SSL",
                    "helpText": "Use secure connection when connection to Sabnzbd",
                    "value": form.useSSL,
                    "type": "checkbox",
                    "advanced": false,
                    "privacy": "normal",
                    "isFloat": false
                },
                {
                    "order": 4,
                    "name": "apiKey",
                    "label": "API Key",
                    "value": form.apiKey,
                    "type": "textbox",
                    "advanced": false,
                    "privacy": "apiKey",
                    "isFloat": false
                }
            ]
        } as ArrCreateDownloadClientRequest

        if (form.urlBase){
            createDownloadClientRequest.fields.push({
                "order": 3,
                "name": "urlBase",
                "label": "URL Base",
                "helpText": "Adds a prefix to the Sabnzbd url, such as http://[host]:[port]/[urlBase]/api",
                "type": "textbox",
                "advanced": true,
                "privacy": "normal",
                "isFloat": false,
                "value" : form.urlBase
            })
        }

        //Find an existing one
        if (DOWNLOAD_CLIENT_ID){
            const downloadClient = await arrService.getDownloadClient(DOWNLOAD_CLIENT_ID, config);
            if (downloadClient){
                updateMethod = 'put',
                createDownloadClientRequest.id = DOWNLOAD_CLIENT_ID
            }
        }

        const url : string = `${HOST}/api/v3/downloadclient?apikey=${API_KEY}`;
        try {
            const {data : {id}} = await axios[updateMethod](url, createDownloadClientRequest, {
                headers: {
                    'X-Api-Key': API_KEY
                }
            });
            setParameter(download_id_key, id);

            return id;
        } catch (err){
            throw err;
        }
    },

    getDownloadClient : async(id : number, config : ArrConfig) : Promise<DownloadClientResponse | undefined> => {
        const {API_KEY, HOST} = config;
        const url : string = `${HOST}/api/v3/downloadclient/${id}?apikey=${API_KEY}`;

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

    createUpdateIndexer : async(form : CreateIndexerForm, config : ArrConfig, indexer_id_key : IplayarrParameter) : Promise<number> => {
        const {API_KEY, HOST, INDEXER_ID} = config;
        let updateMethod : keyof AxiosInstance = 'post';

        const createIndexerRequest : CreateIndexerRequest = {
            ...createIndexerRequestSkeleton,
            name : form.name,
            downloadClientId : form.downloadClientId,
            fields : [
                ...createIndexRequestFieldsSkeleton,
                {
                    "order": 0,
                    "name": "baseUrl",
                    "label": "URL",
                    "value": form.url,
                    "type": "textbox",
                    "advanced": false,
                    "privacy": "normal",
                    "isFloat": false
                },
                {
                    "order": 1,
                    "name": "apiPath",
                    "label": "API Path",
                    "helpText": "Path to the api, usually /api",
                    "value": `${form.urlBase || '/api'}`,
                    "type": "textbox",
                    "advanced": true,
                    "privacy": "normal",
                    "isFloat": false
                },
                {
                    "order": 2,
                    "name": "apiKey",
                    "label": "API Key",
                    "value": form.apiKey,
                    "type": "textbox",
                    "advanced": false,
                    "privacy": "apiKey",
                    "isFloat": false
                },
                {
                    "order": 3,
                    "name": "categories",
                    "label": "Categories",
                    "helpText": "Drop down list, leave blank to disable standard/daily shows",
                    "value": form.categories,
                    "type": "select",
                    "advanced": false,
                    "selectOptionsProviderAction": "newznabCategories",
                    "privacy": "normal",
                    "isFloat": false
                }
            ]
        } as CreateIndexerRequest;

        //Find an existing one
        if (INDEXER_ID){
            const indexer = await arrService.getIndexer(INDEXER_ID, config);
            if (indexer){
                updateMethod = 'put',
                createIndexerRequest.id = INDEXER_ID
            }
        }

        const url : string = `${HOST}/api/v3/indexer?apikey=${API_KEY}`;
        try {
            const {data : {id}} = await axios[updateMethod](url, createIndexerRequest, {
                headers: {
                    'X-Api-Key': API_KEY
                }
            });
            setParameter(indexer_id_key, id);
            return id;
        } catch (err){
            throw err;
        }
    },

    getIndexer : async(id : number, config : ArrConfig) : Promise<IndexerResponse | undefined> => {
        const {API_KEY, HOST} = config;
        const url : string = `${HOST}/api/v3/indexer/${id}?apikey=${API_KEY}`;

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
    }
}

export default arrService;