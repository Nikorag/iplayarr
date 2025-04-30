import express from 'express';
import request from 'supertest';

import router from '../../../src/routes/json-api/OffScheduleRoute'; // adjust if needed
import episodeCacheService from '../../../src/service/episodeCacheService';
import { ApiError } from '../../../src/types/responses/ApiResponse';
import { EpisodeCacheDefinition } from '../../../src/types/responses/EpisodeCacheTypes';
import { OffScheduleFormValidator } from '../../../src/validators/OffScheduleFormValidator';

jest.mock('../../../src/service/episodeCacheService');
jest.mock('../../../src/validators/OffScheduleFormValidator');

const app = express();
app.use(express.json());
app.use('/', router);

describe('Episode Cache Router', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /', () => {
        it('returns cached series', async () => {
            const mockData = [{ id: 1, name: 'Test Show', url: 'http://test.url' }];
            (episodeCacheService.getCachedSeries as jest.Mock).mockResolvedValue(mockData);

            const res = await request(app).get('/');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockData);
        });
    });

    describe('POST /', () => {
        it('adds new cached series with valid input', async () => {
            const body = { name: 'Show', url: 'http://url' };
            const updatedCache = [{ id: 2, ...body }];
            const mockValidator = {
                validate: jest.fn().mockResolvedValue({}),
            };
            (OffScheduleFormValidator as jest.Mock).mockImplementation(() => mockValidator);
            (episodeCacheService.getCachedSeries as jest.Mock).mockResolvedValue(updatedCache);

            const res = await request(app).post('/').send(body);

            expect(mockValidator.validate).toHaveBeenCalledWith(body);
            expect(episodeCacheService.addCachedSeries).toHaveBeenCalledWith(body.url, body.name);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updatedCache);
        });

        it('returns 400 for invalid input', async () => {
            const body = { name: '', url: '' };
            const validationErrors = { name: 'Required', url: 'Required' };
            const mockValidator = {
                validate: jest.fn().mockResolvedValue(validationErrors),
            };
            (OffScheduleFormValidator as jest.Mock).mockImplementation(() => mockValidator);

            const res = await request(app).post('/').send(body);
            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: ApiError.INVALID_INPUT,
                invalid_fields: validationErrors,
            });
        });
    });

    describe('PUT /', () => {
        it('updates a cached series with valid input', async () => {
            const body = { id: 1, name: 'Updated Show', url: 'http://new.url' };
            const updatedCache = [body];
            const mockValidator = {
                validate: jest.fn().mockResolvedValue({}),
            };
            (OffScheduleFormValidator as jest.Mock).mockImplementation(() => mockValidator);
            (episodeCacheService.getCachedSeries as jest.Mock).mockResolvedValue(updatedCache);

            const res = await request(app).put('/').send(body);

            expect(mockValidator.validate).toHaveBeenCalledWith(body);
            expect(episodeCacheService.updateCachedSeries).toHaveBeenCalledWith({
                id: body.id,
                name: body.name,
                url: body.url,
                cacheRefreshed: undefined,
            });
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updatedCache);
        });

        it('returns 400 for invalid update input', async () => {
            const body = { id: 1, name: '', url: '' };
            const validationErrors = { name: 'Invalid', url: 'Invalid' };
            const mockValidator = {
                validate: jest.fn().mockResolvedValue(validationErrors),
            };
            (OffScheduleFormValidator as jest.Mock).mockImplementation(() => mockValidator);

            const res = await request(app).put('/').send(body);
            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: ApiError.INVALID_INPUT,
                invalid_fields: validationErrors,
            });
        });
    });

    describe('DELETE /', () => {
        it('removes a cached series', async () => {
            const id = 5;
            const updatedCache: EpisodeCacheDefinition[] = [];
            (episodeCacheService.getCachedSeries as jest.Mock).mockResolvedValue(updatedCache);

            const res = await request(app).delete('/').send({ id });
            expect(episodeCacheService.removeCachedSeries).toHaveBeenCalledWith(id);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updatedCache);
        });
    });

    describe('POST /refresh', () => {
        it('calls recache and returns status', async () => {
            const def = { id: 1, name: 'ReShow', url: 'http://u' };

            const res = await request(app).post('/refresh').send(def);
            expect(episodeCacheService.recacheSeries).toHaveBeenCalledWith(def);
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: true });
        });
    });
});
