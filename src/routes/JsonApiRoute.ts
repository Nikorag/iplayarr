import { Request, Response, Router } from "express";
import historyService from "../service/historyService";
import queueService from "../service/queueService";
import socketService from "../service/socketService";
import { QueueEntry } from "../types/QueueEntry";
import { ConfigMap, getAllConfig, getParameter, removeParameter, setParameter } from "../service/configService";
import { DownloadClientResponse } from "../types/responses/arr/DownloadClientResponse";
import sonarrService from "../service/sonarrService";
import { IplayarrParameter } from "../types/IplayarrParameters";
import { Validator } from "../validators/Validator";
import { ConfigFormValidator } from "../validators/ConfigFormValidator";
import { ApiError, ApiResponse } from "../types/responses/ApiResponse";
import { SonarrConfigResponse } from "../types/responses/frontend/SonarrConfigResponse";
import { CreateDownloadClientForm } from "../types/requests/form/CreateDownloadClientForm";
import radarrService from "../service/radarrService";
import { IndexerResponse } from "../types/responses/arr/IndexerResponse";
import { CreateIndexerForm } from "../types/requests/form/CreateIndexerForm";
import synonymService from "../service/synonymService";
import { Synonym } from "../types/Synonym";

const router : Router = Router();

interface DeleteRequest {
    pid : string
}

router.get('/synonym', async (_, res : Response) => {
    const synonyms = await synonymService.getAllSynonyms();
    res.json(synonyms);
});

router.post('/synonym', async (req : Request, res : Response) => {
    const synonym : Synonym = req.body as any as Synonym;
    await synonymService.addSynonym(synonym);
    const synonyms = await synonymService.getAllSynonyms();
    res.json(synonyms);
});

router.delete('/synonym', async (req : Request, res : Response) => {
    const {id} = req.body;
    await synonymService.removeSynonym(id);
    const synonyms = await synonymService.getAllSynonyms();
    res.json(synonyms);
});

router.get('/config', async (_, res : Response) => {
    const configMap : ConfigMap = await getAllConfig();
    res.json(configMap);
});

router.put('/config', async (req, res : Response) => {
    const validator : Validator = new ConfigFormValidator();
    const validationResult : {[key:string] : string} = validator.validate(req.body);
    if (Object.keys(validationResult).length > 0){
        const apiResponse : ApiResponse = {
            error : ApiError.INVALID_INPUT,
            invalid_fields : validationResult
        }
        res.status(400).json(apiResponse);
        return;
    }
    for (const key of Object.keys(req.body)){
        await setParameter(key as IplayarrParameter, req.body[key]);
    }
    res.json(req.body);
});

router.get('/queue', (_ : Request, res : Response) => {
    const queue : QueueEntry[] = queueService.getQueue() || [];
    res.json(queue);
});

router.get('/history', async (_ : Request, res : Response) => {
    const history : QueueEntry[] = await historyService.getHistory() || [];
    res.json(history);
});

router.delete('/history', async (req : Request, res : Response) => {
    const {pid} = req.query as any as DeleteRequest;
    await historyService.removeHistory(pid);
    const history = await historyService.getHistory() || [];
    socketService.emit("history", history);
    res.json(history);
});

router.delete('/queue', async (req : Request, res : Response) => {
    const {pid} = req.query as any as DeleteRequest;
    queueService.cancelItem(pid);
    const queue : QueueEntry[] = queueService.getQueue() || [];
    socketService.emit("queue", queue);
    res.json(queue);
});

router.get('/sonarr', async (req : Request, res : Response) =>{
    const [url, api_key] = await Promise.all([
        getParameter(IplayarrParameter.SONARR_HOST),
        getParameter(IplayarrParameter.SONARR_API_KEY),
    ]) as string[]
    const download_client : DownloadClientResponse | undefined = await sonarrService.getDownloadClient();
    const indexer : IndexerResponse | undefined = await sonarrService.getIndexer();
    const sonarrConfig : SonarrConfigResponse = {
        url,
        api_key,
        download_client : download_client || {},
        indexer : indexer || {}
    }
    res.json(sonarrConfig);
});

router.get('/radarr', async (req : Request, res : Response) =>{
    const [url, api_key] = await Promise.all([
        getParameter(IplayarrParameter.RADARR_HOST),
        getParameter(IplayarrParameter.RADARR_API_KEY),
    ]) as string[]
    const download_client : DownloadClientResponse | undefined = await radarrService.getDownloadClient();
    const indexer : IndexerResponse | undefined = await radarrService.getIndexer();
    const radarrConfig : SonarrConfigResponse = {
        url,
        api_key,
        download_client : download_client || {},
        indexer : indexer || {}
    }
    res.json(radarrConfig);
});

router.put('/sonarr', async (req : Request, res : Response) => {
    const response : SonarrConfigResponse = req.body as any as SonarrConfigResponse;
    await setParameter(IplayarrParameter.SONARR_API_KEY, response.api_key);
    await setParameter(IplayarrParameter.SONARR_HOST, response.url);
    const iplayarr_api_key = await getParameter(IplayarrParameter.API_KEY);
    let downloadClientId;
    try {
        const downloadClientForm : CreateDownloadClientForm = {
            name: response.download_client.name as string,
            host: response.download_client.host as string,
            port: response.download_client.port as number,
            useSSL: false,
            apiKey: iplayarr_api_key as string
        };
        downloadClientId = await sonarrService.createUpdateDownloadClient(downloadClientForm);
    } catch (err : any){
        const apiResponse : ApiResponse = {
            error : ApiError.INTERNAL_ERROR,
            message : `Unable to create Sonarr download client, error: ${err.message}`
        }
        res.status(500).json(apiResponse);
        return
    }
    try {
        const indexerForm : CreateIndexerForm = {
            name: response.indexer.name as string,
            downloadClientId, 
            url: response.indexer.url as string,
            apiKey: iplayarr_api_key as string,
            categories: [5030, 5040]
        }
        await sonarrService.createUpdateIndexer(indexerForm);
    } catch (err : any){
        const apiResponse : ApiResponse = {
            error : ApiError.INTERNAL_ERROR,
            message : `Unable to create Sonarr indexer, error: ${err.message}`
        }
        res.status(500).json(apiResponse);
        return
    }
    res.json(req.body);
});

router.put('/radarr', async (req : Request, res : Response) => {
    const response : SonarrConfigResponse = req.body as any as SonarrConfigResponse;
    await setParameter(IplayarrParameter.RADARR_API_KEY, response.api_key);
    await setParameter(IplayarrParameter.RADARR_HOST, response.url);
    const iplayarr_api_key = await getParameter(IplayarrParameter.API_KEY);
    let downloadClientId;
    try {
        const downloadClientForm : CreateDownloadClientForm = {
            name: response.download_client.name as string,
            host: response.download_client.host as string,
            port: response.download_client.port as number,
            useSSL: false,
            apiKey: iplayarr_api_key as string
        };
        downloadClientId = await radarrService.createUpdateDownloadClient(downloadClientForm);
    } catch (err : any){
        const apiResponse : ApiResponse = {
            error : ApiError.INTERNAL_ERROR,
            message : `Unable to create Radarr download client, error: ${err.message}`
        }
        res.status(500).json(apiResponse);
        return
    }
    try {
        const indexerForm : CreateIndexerForm = {
            name: response.indexer.name as string,
            downloadClientId, 
            url: response.indexer.url as string,
            apiKey: iplayarr_api_key as string,
            categories: [2010, 2020, 2030, 2040, 2045, 2050, 2060]
        }
        await radarrService.createUpdateIndexer(indexerForm);
    } catch (err : any){
        const apiResponse : ApiResponse = {
            error : ApiError.INTERNAL_ERROR,
            message : `Unable to create Radarr indexer, error: ${err.message}`
        }
        res.status(500).json(apiResponse);
        return
    }
    res.json(req.body);
});

router.delete("/sonarr/download_client", (_, res : Response) => {
    removeParameter(IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);
    res.json(true)
});

router.delete("/radarr/download_client", (_, res : Response) => {
    removeParameter(IplayarrParameter.RADARR_DOWNLOAD_CLIENT_ID);
    res.json(true)
});

router.delete("/sonarr/indexer", (_, res : Response) => {
    removeParameter(IplayarrParameter.SONARR_INDEXER_ID);
    res.json(true)
});

router.delete("/radarr/indexer", (_, res : Response) => {
    removeParameter(IplayarrParameter.RADARR_INDEXER_ID);
    res.json(true)
});


export default router;