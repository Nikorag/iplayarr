import arrService from '../../src/service/arrService'
import axios from 'axios';
import { IplayarrParameter } from '../../src/types/IplayarrParameters';
import {withSpies, SpyMap} from '../TestUtils'

jest.mock("axios");

jest.mock('../../src/service/configService', () => ({
    setParameter: jest.fn()
}));


afterEach(() => {
    jest.clearAllMocks();
});

describe("arrService", () => {
    describe("createUpdateDownloadClient", () => {
        it("should create a new download client when no existing client is found", async () => {
            await withSpies(async (spies : SpyMap) => {
                spies.getDownloadClient = jest.spyOn(arrService, "getDownloadClient").mockImplementation(async (_id, _config) => undefined);
                (axios.post as jest.Mock).mockResolvedValue({data : {id : "id"}});
                await arrService.createUpdateDownloadClient({
                    name: '',
                    host: '',
                    port: 0,
                    useSSL: false,
                    apiKey: ''
                }, {
                    API_KEY: 'API_KEY',
                    HOST: 'HOST',
                    DOWNLOAD_CLIENT_ID : 5
                }, IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);

                expect(axios.post).toHaveBeenCalledWith(`HOST/api/v3/downloadclient?apikey=API_KEY`, expect.anything(), expect.anything());
                expect(axios.put).not.toHaveBeenCalled();
            });
        });

        it("should update an existing download client when one is found", async () => {
            await withSpies(async (spies : SpyMap) => {
                spies.getDownloadClient = jest.spyOn(arrService, "getDownloadClient").mockImplementation(async (_id, _config) => ({"name" : "client"}));
                (axios.put as jest.Mock).mockResolvedValue({data : {id : "id"}});
                await arrService.createUpdateDownloadClient({
                    name: '',
                    host: '',
                    port: 0,
                    useSSL: false,
                    apiKey: ''
                }, {
                    API_KEY: 'API_KEY',
                    HOST: 'HOST',
                    DOWNLOAD_CLIENT_ID : 5
                }, IplayarrParameter.SONARR_DOWNLOAD_CLIENT_ID);

                expect(axios.put).toHaveBeenCalledWith(`HOST/api/v3/downloadclient?apikey=API_KEY`, expect.objectContaining({
                    id : 5
                }), expect.anything());
                expect(axios.post).not.toHaveBeenCalled();
            });
        });
    });

    describe("getDownloadClient", () => {
        it("should return a download client when found", async () => {
            // Test implementation
        });

        it("should return undefined when the client does not exist", async () => {
            // Test implementation
        });
    });

    describe("createUpdateIndexer", () => {
        it("should create a new indexer when no existing indexer is found", async () => {
            // Test implementation
        });

        it("should update an existing indexer when one is found", async () => {
            // Test implementation
        });

        it("should handle API errors gracefully", async () => {
            // Test implementation
        });
    });

    describe("getIndexer", () => {
        it("should return an indexer when found", async () => {
            // Test implementation
        });

        it("should return undefined when the indexer does not exist", async () => {
            // Test implementation
        });
    });
});
