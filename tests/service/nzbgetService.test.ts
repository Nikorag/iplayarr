import axios from 'axios';
import nzbGetService from 'src/service/nzbgetService';
import { App } from 'src/types/App';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('nzbGetService', () => {

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
    });

    describe('testConnection', () => {
        it('should return true when connection is successful', async () => {
            const mockResponse = { status: 200 };
            mockedAxios.get.mockResolvedValue(mockResponse);

            const inputUrl = 'http://localhost:6789';
            const username = 'testuser';
            const password = 'testpassword';

            const result = await nzbGetService.testConnection(inputUrl, username, password);

            expect(result).toBe(true);
            expect(mockedAxios.get).toHaveBeenCalledWith('http://testuser:testpassword@localhost:6789/jsonrpc/version');
        });

        it('should return Axios Message when connection fails', async () => {
            const mockError = { message: 'Request failed' };
            mockedAxios.get.mockRejectedValue(mockError);
            mockedAxios.isAxiosError.mockReturnValue(true);

            const inputUrl = 'http://localhost:6789';
            const username = 'testuser';
            const password = 'testpassword';

            const result = await nzbGetService.testConnection(inputUrl, username, password);

            expect(result).toBe('Request failed');
            expect(mockedAxios.get).toHaveBeenCalledWith('http://testuser:testpassword@localhost:6789/jsonrpc/version');
        });

        it('should return false when connection fails without Axios error', async () => {
            const mockError = { message: 'Request failed' };
            mockedAxios.get.mockRejectedValue(mockError);
            mockedAxios.isAxiosError.mockReturnValue(false);

            const inputUrl = 'http://localhost:6789';
            const username = 'testuser';
            const password = 'testpassword';

            const result = await nzbGetService.testConnection(inputUrl, username, password);

            expect(result).toBe(false);
            expect(mockedAxios.get).toHaveBeenCalledWith('http://testuser:testpassword@localhost:6789/jsonrpc/version');
        });

        it('should return false when status is not 200', async () => {
            const mockResponse = { status: 500 };
            mockedAxios.get.mockResolvedValue(mockResponse);

            const inputUrl = 'http://localhost:6789';
            const username = 'testuser';
            const password = 'testpassword';

            const result = await nzbGetService.testConnection(inputUrl, username, password);

            expect(result).toBe(false);
            expect(mockedAxios.get).toHaveBeenCalledWith('http://testuser:testpassword@localhost:6789/jsonrpc/version');
        });
    });

    describe('addFile', () => {
        it('should return a successful response when adding a file', async () => {
            const mockResponse = { status: 200 };
            mockedAxios.post.mockResolvedValue(mockResponse);

            const app: App = {
                url: 'http://localhost:6789',
                username: 'testuser',
                password: 'testpassword'
            } as App;
            const mockFile = {
                originalname: 'test.nzb',
                buffer: Buffer.from('dummy content'),
                mimetype: 'application/octet-stream'
            } as Express.Multer.File;

            const files = [mockFile];

            const result = await nzbGetService.addFile(app, files);

            expect(result.status).toBe(200);
            expect(result.data.status).toBe(true);
            expect(result.data.nzo_ids.length).toBe(1);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                `${app.url}/jsonrpc/append`,
                expect.objectContaining({
                    method: 'append',
                    params: expect.arrayContaining([
                        'test.nzb', // File name
                        expect.stringContaining(Buffer.from('dummy content').toString('base64')), // Base64 content
                        'iplayer', // Category
                        expect.any(String) // nzo_id (UUID)
                    ])
                }),
                expect.objectContaining({
                    auth: {
                        username: app.username,
                        password: app.password
                    },
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });

        it('should handle an exception when adding a file', async () => {
            mockedAxios.post.mockResolvedValue({
                status : 404
            })

            const app: App = {
                url: 'http://localhost:6789',
                username: 'testuser',
                password: 'testpassword'
            } as App;
            const mockFile = {
                originalname: 'test.nzb',
                buffer: Buffer.from('dummy content'),
                mimetype: 'application/octet-stream'
            } as Express.Multer.File;

            const files = [mockFile];

            const result = await nzbGetService.addFile(app, files);

            expect(result.status).toBe(404);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                `${app.url}/jsonrpc/append`,
                expect.any(Object),
                expect.any(Object)
            );
        });

        it('should handle a non 200 response when adding a file', async () => {
            const mockError = { status: 500, message: 'Error adding file' };
            mockedAxios.post.mockRejectedValue(mockError);

            const app: App = {
                url: 'http://localhost:6789',
                username: 'testuser',
                password: 'testpassword'
            } as App;
            const mockFile = {
                originalname: 'test.nzb',
                buffer: Buffer.from('dummy content'),
                mimetype: 'application/octet-stream'
            } as Express.Multer.File;

            const files = [mockFile];

            const result = await nzbGetService.addFile(app, files);

            expect(result.status).toBe(500);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                `${app.url}/jsonrpc/append`,
                expect.any(Object),
                expect.any(Object)
            );
        });
    });
});
