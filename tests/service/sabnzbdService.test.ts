import axios from 'axios';
import FormData from 'form-data';

import sabzbdService from '../../src/service/nzb/SabNZBDService';
import { App } from '../../src/types/App';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('sabzbdService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const app: App = {
        url: 'http://localhost:8080',
        api_key: 'mockapikey',
    } as App;

    describe('getAddFileUrl', () => {
        it('should return correct addfile URL', async () => {
            const url = sabzbdService.getAddFileUrl(app);
            expect(url).toBe('http://localhost:8080/api?mode=addfile&cat=iplayer&priority=-100&apikey=mockapikey');
        });
    });

    describe('testConnection', () => {
        it('should return true for 200 response', async () => {
            mockedAxios.get.mockResolvedValue({ status: 200 });

            const result = await sabzbdService.testConnection(app.url, { apikey: app.api_key });
            expect(result).toBe(true);
            expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8080/api?mode=queue&apikey=mockapikey');
        });

        it('should return false for non-200 response', async () => {
            mockedAxios.get.mockResolvedValue({ status: 403 });

            const result = await sabzbdService.testConnection(app.url, { apikey: app.api_key });
            expect(result).toBe(false);
        });

        it('should return error message for axios error', async () => {
            mockedAxios.get.mockRejectedValue({ isAxiosError: true, message: 'Network error' });
            mockedAxios.isAxiosError.mockReturnValue(true);

            const result = await sabzbdService.testConnection(app.url, { apikey: app.api_key });
            expect(result).toBe('Network error');
        });

        it('should return false for non-axios error', async () => {
            mockedAxios.get.mockRejectedValue(new Error('Some other error'));
            mockedAxios.isAxiosError.mockReturnValue(false);

            const result = await sabzbdService.testConnection(app.url, { apikey: app.api_key });
            expect(result).toBe(false);
        });
    });

    describe('addFile', () => {
        it('should send a POST request with FormData', async () => {
            const file = {
                originalname: 'test.nzb',
                mimetype: 'application/x-nzb',
                buffer: Buffer.from('nzb content'),
            } as Express.Multer.File;

            mockedAxios.post.mockResolvedValue({ status: 200, data: 'OK' });

            const response = await sabzbdService.addFile(app, [file]);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'http://localhost:8080/api?mode=addfile&cat=iplayer&priority=-100&apikey=mockapikey',
                expect.any(FormData),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'multipart/form-data',
                    }),
                })
            );

            expect(response).toEqual({ status: 200, data: 'OK' });
        });
    });
});
