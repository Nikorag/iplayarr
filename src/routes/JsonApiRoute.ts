import { Request, Response, Router } from 'express';

import arrService from '../service/arrService';
import configService, { ConfigMap } from '../service/configService';
import episodeCacheService from '../service/episodeCacheService';
import historyService from '../service/historyService';
import iplayerService from '../service/iplayerService';
import queueService from '../service/queueService';
import radarrService from '../service/radarrService';
import sabzbdService from '../service/sabnzbdService';
import socketService from '../service/socketService';
import sonarrService from '../service/sonarrService';
import synonymService from '../service/synonymService';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerSearchResult } from '../types/IPlayerSearchResult';
import { qualityProfiles } from '../types/QualityProfiles';
import { QueueEntry } from '../types/QueueEntry';
import { CreateDownloadClientForm } from '../types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../types/requests/form/CreateIndexerForm';
import { ApiError, ApiResponse } from '../types/responses/ApiResponse';
import { DownloadClientResponse } from '../types/responses/arr/DownloadClientResponse';
import { IndexerResponse } from '../types/responses/arr/IndexerResponse';
import { EpisodeCacheDefinition } from '../types/responses/EpisodeCacheTypes';
import { SonarrConfigResponse } from '../types/responses/frontend/SonarrConfigResponse';
import { Synonym } from '../types/Synonym';
import { md5 } from '../utils/Utils';
import { ConfigFormValidator } from '../validators/ConfigFormValidator';
import { Validator } from '../validators/Validator';

const router : Router = Router();

interface DeleteRequest {
    pid : string
}

router.get('/hiddenSettings', (_, res : Response) => {
    res.json(
        {'HIDE_DONATE' : process.env.HIDE_DONATE || false}
    )
})

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

router.get('/qualityProfiles', (_, res : Response) => {
    res.json(qualityProfiles);
});

router.get('/config', async (_, res : Response) => {
    const configMap : ConfigMap = await configService.getAllConfig();
    res.json(configMap);
});

router.put('/config', async (req, res : Response) => {
    const validator : Validator = new ConfigFormValidator();
    const validationResult : {[key:string] : string} = await validator.validate(req.body);
    if (Object.keys(validationResult).length > 0){
        const apiResponse : ApiResponse = {
            error : ApiError.INVALID_INPUT,
            invalid_fields : validationResult
        }
        res.status(400).json(apiResponse);
        return;
    }
    for (const key of Object.keys(req.body)){
        if (key != 'AUTH_PASSWORD'){
            await configService.setParameter(key as IplayarrParameter, req.body[key]);
        } else {
            const existingPassword = await configService.getParameter(IplayarrParameter.AUTH_PASSWORD);
            if (existingPassword != req.body[key]){
                await configService.setParameter(key as IplayarrParameter, md5(req.body[key]));
            }
        }
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
    socketService.emit('history', history);
    res.json(history);
});

router.delete('/queue', async (req : Request, res : Response) => {
    const {pid} = req.query as any as DeleteRequest;
    queueService.cancelItem(pid);
    const queue : QueueEntry[] = queueService.getQueue() || [];
    socketService.emit('queue', queue);
    res.json(queue);
});

router.get('/sonarr', async (req : Request, res : Response) =>{
    const [url, api_key] = await Promise.all([
        configService.getParameter(IplayarrParameter.SONARR_HOST),
        configService.getParameter(IplayarrParameter.SONARR_API_KEY),
    ]) as string[]
    const download_client : DownloadClientResponse | undefined = url ? await sonarrService.getDownloadClient() : undefined;
    const indexer : IndexerResponse | undefined = url ? await sonarrService.getIndexer() : undefined;
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
        configService.getParameter(IplayarrParameter.RADARR_HOST),
        configService.getParameter(IplayarrParameter.RADARR_API_KEY),
    ]) as string[]
    const download_client : DownloadClientResponse | undefined = url ? await radarrService.getDownloadClient() : undefined;
    const indexer : IndexerResponse | undefined = url ? await radarrService.getIndexer() : undefined;
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
    await configService.setParameter(IplayarrParameter.SONARR_API_KEY, response.api_key);
    await configService.setParameter(IplayarrParameter.SONARR_HOST, response.url);
    const iplayarr_api_key = await configService.getParameter(IplayarrParameter.API_KEY);
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
    await configService.setParameter(IplayarrParameter.RADARR_API_KEY, response.api_key);
    await configService.setParameter(IplayarrParameter.RADARR_HOST, response.url);
    const iplayarr_api_key = await configService.getParameter(IplayarrParameter.API_KEY);
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

router.delete('/sonarr/download_client', (_, res : Response) => {
    configService.removeParameter(IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);
    res.json(true)
});

router.delete('/radarr/download_client', (_, res : Response) => {
    configService.removeParameter(IplayarrParameter.RADARR_DOWNLOAD_CLIENT_ID);
    res.json(true)
});

router.delete('/sonarr/indexer', (_, res : Response) => {
    configService.removeParameter(IplayarrParameter.SONARR_INDEXER_ID);
    res.json(true)
});

router.delete('/radarr/indexer', (_, res : Response) => {
    configService.removeParameter(IplayarrParameter.RADARR_INDEXER_ID);
    res.json(true)
});

router.post('/arr/test', async (req : Request, res : Response) => {
    const {API_KEY, HOST} = req.body;
    const result : string | boolean = await arrService.testConnection({API_KEY, HOST});
    if (result == true){
        res.json(true);
    } else {
        res.status(500).json({error: ApiError.INTERNAL_ERROR, message : result} as ApiResponse)
    }
});

router.post('/sabnzbd/test', async (req : Request, res : Response) => {
    const {SABNZBD_URL, SABNZBD_API_KEY} = req.body;
    const result : string | boolean = await sabzbdService.testConnection(SABNZBD_URL, SABNZBD_API_KEY);
    if (result == true){
        res.json(true);
    } else {
        res.status(500).json({error: ApiError.INTERNAL_ERROR, message : result} as ApiResponse)
    }
});

router.get('/search', async (req : Request, res : Response) => {
    const {q} = req.query as any;
    const result : IPlayerSearchResult[] = await iplayerService.search(q);
    res.json(result);
});

router.get('/details', async (req : Request, res : Response) => {
    const {pid} = req.query as any;
    const details = await iplayerService.details([pid]);
    res.json(details[0]);
});

router.get('/download', async (req : Request, res : Response) => {
    const {pid, nzbName, type} = req.query as any;
    queueService.addToQueue(pid, nzbName, type);
    res.json(true)
});

router.get('/cache-refresh', async (_, res : Response) => {
    iplayerService.refreshCache();
    res.json(true);
});

router.get('/offSchedule', async (_, res : Response) => {
    const cachedSeries : EpisodeCacheDefinition[] = await episodeCacheService.getCachedSeries();
    res.json(cachedSeries);
});

router.post('/offSchedule', async (req : Request, res : Response) => {
    const {name, url} = req.body;
    await episodeCacheService.addCachedSeries(url, name);
    const cachedSeries : EpisodeCacheDefinition[] = await episodeCacheService.getCachedSeries();
    res.json(cachedSeries);
});

router.delete('/offSchedule', async (req : Request, res : Response) => {
    const {id} = req.body;
    await episodeCacheService.removeCachedSeries(id);
    const cachedSeries : EpisodeCacheDefinition[] = await episodeCacheService.getCachedSeries();
    res.json(cachedSeries);
});

router.post('/offSchedule/refresh', async (req : Request, res : Response) => {
    const def : EpisodeCacheDefinition = req.body;
    episodeCacheService.recacheSeries(def);
    res.json(true);
});

export default router;
