import { IplayarrParameter } from '../types/IplayarrParameters';
import { CreateDownloadClientForm } from '../types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../types/requests/form/CreateIndexerForm';
import { DownloadClientResponse } from '../types/responses/arr/DownloadClientResponse';
import { IndexerResponse } from '../types/responses/arr/IndexerResponse';
import arrService, { ArrConfig } from './arrService';
import configService from './configService';

const radarrService = {
    getConfig: async (): Promise<ArrConfig> => {
        const API_KEY = await configService.getParameter(IplayarrParameter.RADARR_API_KEY) as string;
        const HOST = await configService.getParameter(IplayarrParameter.RADARR_HOST) as string;
        const RADARR_DOWNLOAD_CLIENT_ID = await configService.getParameter(IplayarrParameter.RADARR_DOWNLOAD_CLIENT_ID);
        const RADARR_INDEXER_ID = await configService.getParameter(IplayarrParameter.RADARR_INDEXER_ID);

        return {
            API_KEY,
            HOST,
            DOWNLOAD_CLIENT_ID: RADARR_DOWNLOAD_CLIENT_ID ? parseInt(RADARR_DOWNLOAD_CLIENT_ID) : undefined,
            INDEXER_ID: RADARR_INDEXER_ID ? parseInt(RADARR_INDEXER_ID) : undefined,
        }
    },

    getDownloadClient : async() : Promise<DownloadClientResponse | undefined> => {
        const client_id = await configService.getParameter(IplayarrParameter.RADARR_DOWNLOAD_CLIENT_ID);
        if (client_id){
            const config : ArrConfig = await radarrService.getConfig();
            return await arrService.getDownloadClient(parseInt(client_id), config);
        } else {
            return;
        }
    },

    createUpdateDownloadClient: async (form: CreateDownloadClientForm): Promise<number> => {
        try {
            const config: ArrConfig = await radarrService.getConfig();
            const id = await arrService.createUpdateDownloadClient(form, config, IplayarrParameter.RADARR_DOWNLOAD_CLIENT_ID);
            return id;
        } catch (err){
            throw err;
        }
    },

    getIndexer : async() : Promise<IndexerResponse | undefined> => {
        const client_id = await configService.getParameter(IplayarrParameter.RADARR_INDEXER_ID);
        if (client_id){
            const config : ArrConfig = await radarrService.getConfig();
            return await arrService.getIndexer(parseInt(client_id), config);
        } else {
            return;
        }
    },

    createUpdateIndexer : async (form : CreateIndexerForm) : Promise<number> => {
        try {
            const config : ArrConfig = await radarrService.getConfig();
            const id = await arrService.createUpdateIndexer(form, config, IplayarrParameter.RADARR_INDEXER_ID);
            return id;
        } catch (err){
            throw err;
        }
    }
}

export default radarrService;