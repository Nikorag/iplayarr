import { IplayarrParameter } from "../types/IplayarrParameters";
import { CreateDownloadClientForm } from "../types/requests/form/CreateDownloadClientForm";
import { CreateIndexerForm } from "../types/requests/form/CreateIndexerForm";
import { DownloadClientResponse } from "../types/responses/arr/DownloadClientResponse";
import { IndexerResponse } from "../types/responses/arr/IndexerResponse";
import { SonarrEpisodeResponse, SonarrSeriesResponse } from "../types/responses/sonarr/SonarrSeriesResponse";
import arrService, { ArrConfig } from "./arrService";
import { getParameter } from "./configService";
import axios, { AxiosResponse } from "axios";

const sonarrService = {
    getConfig : async () : Promise<ArrConfig> => {
        const API_KEY = await getParameter(IplayarrParameter.SONARR_API_KEY) as string;
        const HOST = await getParameter(IplayarrParameter.SONARR_HOST) as string;
        const SONARR_DOWNLOAD_CLIENT_ID = await getParameter(IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);
        const SONARR_INDEXER_ID = await getParameter(IplayarrParameter.SONARR_INDEXER_ID);

        return {
            API_KEY,
            HOST,
            DOWNLOAD_CLIENT_ID : SONARR_DOWNLOAD_CLIENT_ID ? parseInt(SONARR_DOWNLOAD_CLIENT_ID) : undefined,
            INDEXER_ID : SONARR_INDEXER_ID ? parseInt(SONARR_INDEXER_ID) : undefined
        }
    },

    findSeries : async (name : string) : Promise<SonarrSeriesResponse | undefined> => {
        const {API_KEY, HOST} = await sonarrService.getConfig();

        if (API_KEY && HOST){
            const url : string = `${HOST}/api/v3/series/lookup?term=${name}`;
            const {data} = await axios.get(url, {
                headers: {
                    'X-Api-Key': API_KEY
                }
            });
            const monitored = data.filter(({path} : any) => path);
            if (monitored.length > 0){
                const {id, seasons, title} = monitored[0];
                return {id, seasons, title};
            }
        }
        return;
    },

    getEpisodeTitle : async(name : string, season : number, episode : number) : Promise<string | undefined> => {
        const {API_KEY, HOST} = await sonarrService.getConfig();

        const series : SonarrSeriesResponse | undefined = await sonarrService.findSeries(name);
        if (series){
            const url : string = `${HOST}/api/v3/episode?seriesId=${series.id}&seasonNumber=${season}&episodeIds=${episode}&apikey=${API_KEY}`;
            const {data} : AxiosResponse<SonarrEpisodeResponse[]> = await axios.get(url, {
                headers: {
                    'X-Api-Key': API_KEY
                }
            });  

            const validEpisodes : SonarrEpisodeResponse[] = data.filter(({episodeNumber}) => episodeNumber == episode);
            if (validEpisodes.length > 0){
                return validEpisodes[0].title;
            }
        }
        return;
    },

    getEpisodeFromTitle : async(name : string, season : number, title : string) : Promise<number | undefined> => {
        const {API_KEY, HOST} = await sonarrService.getConfig();

        const series: SonarrSeriesResponse | undefined = await sonarrService.findSeries(name);
        if (series){
            const url : string = `${HOST}/api/v3/episode?seriesId=${series.id}&seasonNumber=${season}&apikey=${API_KEY}`;
            const {data} : AxiosResponse<SonarrEpisodeResponse[]> = await axios.get(url, {
                headers: {
                    'X-Api-Key': API_KEY
                }
            });  

            const found = data.filter((episode) => title.includes(episode.title));
            if (found.length > 0){
                return found[0].episodeNumber;
            }
        }
        return;
    },

    getDownloadClient : async() : Promise<DownloadClientResponse | undefined> => {
        const client_id = await getParameter(IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);
        if (client_id){
            const config : ArrConfig = await sonarrService.getConfig();
            return await arrService.getDownloadClient(parseInt(client_id), config);
        } else {
            return;
        }
    },

    createUpdateDownloadClient : async (form : CreateDownloadClientForm) : Promise<number> => {
        try {
            const config : ArrConfig = await sonarrService.getConfig();
            const id = await arrService.createUpdateDownloadClient(form, config, IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);
            return id;
        } catch (err){
            throw err;
        }
    },

    getIndexer : async() : Promise<IndexerResponse | undefined> => {
        const client_id = await getParameter(IplayarrParameter.SONARR_INDEXER_ID);
        if (client_id){
            const config : ArrConfig = await sonarrService.getConfig();
            return await arrService.getIndexer(parseInt(client_id), config);
        } else {
            return;
        }
    },

    createUpdateIndexer : async (form : CreateIndexerForm) : Promise<number> => {
        try {
            const config : ArrConfig = await sonarrService.getConfig();
            const id = await arrService.createUpdateIndexer(form, config, IplayarrParameter.SONARR_INDEXER_ID);
            return id;
        } catch (err){
            throw err;
        }
    }
}

export default sonarrService;