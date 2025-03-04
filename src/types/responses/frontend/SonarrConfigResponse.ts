import { DownloadClientResponse } from "../arr/DownloadClientResponse";
import { IndexerResponse } from "../arr/IndexerResponse";

export interface SonarrConfigResponse {
    url : string,
    api_key : string,
    download_client : DownloadClientResponse,
    indexer : IndexerResponse
}