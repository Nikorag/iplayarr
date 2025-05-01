import express, { Response } from 'express';
import request from 'supertest';

import { NewzNabEndpointDirectory } from '../../src/endpoints/EndpointDirectory';
import router from '../../src/routes/ApiRoute';  // Update with the correct path to your router
import configService from '../../src/service/configService';
import { ApiError } from '../../src/types/responses/ApiResponse';

// Mocking dependencies
jest.mock('../../src/service/configService');
jest.mock('../../src/endpoints/EndpointDirectory', () => ({
    SabNZBDEndpointDirectory: {
        someEndpoint: jest.fn(async (_, res: Response) => {
            res.status(200).json({ success: true });
            return true;
        }),
    },
    NewzNabEndpointDirectory: {
        someEndpoint: jest.fn(async (_, res: Response) => {
            res.status(200).json({ success: true });
            return true;
        }),
    },
}));

describe('API Route Tests', () => {
    const app = express();
    app.use('/api', router);

    it('should return 401 if API key is incorrect', async () => {
        // Mock the getParameter method to return a different API key than the one passed in the query
        (configService.getParameter as jest.Mock).mockResolvedValue('correct-api-key');

        const response = await request(app)
            .post('/api')
            .query({ apikey: 'wrong-api-key' })  // Using incorrect API key
            .send();

        expect(response.status).toBe(401);
        expect(response.body.error).toBe(ApiError.NOT_AUTHORISED);
    });

    it('should return 404 if endpoint is not found', async () => {
        // Mock the getParameter method to return the correct API key
        (configService.getParameter as jest.Mock).mockResolvedValue('correct-api-key');

        const response = await request(app)
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
        const response = await request(app)
            .post('/api')
            .query({ apikey: 'correct-api-key', t: 'someEndpoint' })
            .send();

        expect(response.status).toBe(200);
        expect((NewzNabEndpointDirectory as any).someEndpoint).toHaveBeenCalled();
    });
});
