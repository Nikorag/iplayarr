import { EventHandler } from 'h3';

import apiRoute from '../../server/api/index';
import { NewzNabEndpointDirectory } from '../../server/constants/EndpointDirectory';
import configService from '../../server/service/configService';
import { ApiError } from '../../server/types/responses/ApiResponse';
import { testRequest } from '../helpers/h3';

// Mocking dependencies
jest.mock('../../server/service/configService');
jest.mock('../../server/constants/EndpointDirectory', () => ({
    SabNZBDEndpointDirectory: {
        someEndpoint: jest.fn(async () => ({ success: true })),
    },
    NewzNabEndpointDirectory: {
        someEndpoint: jest.fn(async () => ({ success: true })),
    },
}));

describe('API Route Tests', () => {
    const app = testRequest([['get', '/api', apiRoute as EventHandler], ['post', '/api', apiRoute as EventHandler]]);

    it('should return 401 if API key is incorrect', async () => {
        // Mock the getParameter method to return a different API key than the one passed in the query
        (configService.getParameter as jest.Mock).mockResolvedValue('correct-api-key');

        const response = await app
            .post('/api')
            .query({ apikey: 'wrong-api-key' })  // Using incorrect API key
            .send();

        expect(response.status).toBe(401);
        expect(response.body.error).toBe(ApiError.NOT_AUTHORISED);
    });

    it('should return 404 if endpoint is not found', async () => {
        // Mock the getParameter method to return the correct API key
        (configService.getParameter as jest.Mock).mockResolvedValue('correct-api-key');

        const response = await app
            .post('/api')
            .query({ apikey: 'correct-api-key', mode: 'invalidMode' })  // Using invalid mode
            .send();

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(ApiError.API_NOT_FOUND);
    });

    it('should call the correct endpoint if API key is correct and endpoint exists', async () => {
        // Mock the getParameter method to return the correct API key
        (configService.getParameter as jest.Mock).mockResolvedValue('correct-api-key');

        // Send a request with a valid API key and a valid endpoint (NewzNab)
        const response = await app
            .post('/api')
            .query({ apikey: 'correct-api-key', t: 'someEndpoint' })
            .send();

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
        expect((NewzNabEndpointDirectory as any).someEndpoint).toHaveBeenCalled();
    });
});
