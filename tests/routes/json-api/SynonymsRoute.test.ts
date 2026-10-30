import request from 'supertest';

import arrFacade from '../../../server/facade/arrFacade';
import deleteSynonym from '../../../server/routes/json-api/synonym/index.delete';
import getSynonyms from '../../../server/routes/json-api/synonym/index.get';
import postSynonym from '../../../server/routes/json-api/synonym/index.post';
import putSynonym from '../../../server/routes/json-api/synonym/index.put';
import lookup from '../../../server/routes/json-api/synonym/lookup/[appId].get';
import appService from '../../../server/service/appService';
import synonymService from '../../../server/service/synonymService';
import { ApiError } from '../../../server/types/responses/ApiResponse';
import { Synonym } from '../../../server/types/Synonym';
import { nodeApp } from '../../helpers/h3';

jest.mock('../../../server/service/synonymService');
jest.mock('../../../server/service/appService');
jest.mock('../../../server/facade/arrFacade');

const expressApp = nodeApp([
    ['get', '/', getSynonyms],
    ['post', '/', postSynonym],
    ['put', '/', putSynonym],
    ['delete', '/', deleteSynonym],
    ['get', '/lookup/:appId', lookup],
]);

describe('Synonym and Lookup Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /', () => {
        it('returns all synonyms', async () => {
            const synonyms = [{ id: 1, term: 'tv', synonym: 'television' }];
            (synonymService.getAllSynonyms as jest.Mock).mockResolvedValue(synonyms);

            const res = await request(expressApp).get('/');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(synonyms);
        });
    });

    describe('POST /', () => {
        it('adds a synonym and returns updated list', async () => {
            const synonym = { id: 2, term: 'movie', synonym: 'film' };
            const updatedSynonyms = [synonym];

            (synonymService.addSynonym as jest.Mock).mockResolvedValue(undefined);
            (synonymService.getAllSynonyms as jest.Mock).mockResolvedValue(updatedSynonyms);

            const res = await request(expressApp).post('/').send(synonym);
            expect(synonymService.addSynonym).toHaveBeenCalledWith(synonym);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updatedSynonyms);
        });
    });

    describe('PUT /', () => {
        it('updates a synonym and returns updated list', async () => {
            const synonym = { id: 3, term: 'doc', synonym: 'documentary' };
            const updatedSynonyms = [synonym];

            (synonymService.updateSynonym as jest.Mock).mockResolvedValue(undefined);
            (synonymService.getAllSynonyms as jest.Mock).mockResolvedValue(updatedSynonyms);

            const res = await request(expressApp).put('/').send(synonym);
            expect(synonymService.updateSynonym).toHaveBeenCalledWith(synonym);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updatedSynonyms);
        });
    });

    describe('DELETE /', () => {
        it('removes a synonym and returns updated list', async () => {
            const updatedSynonyms: Synonym[] = [];
            const id = 4;

            (synonymService.removeSynonym as jest.Mock).mockResolvedValue(undefined);
            (synonymService.getAllSynonyms as jest.Mock).mockResolvedValue(updatedSynonyms);

            const res = await request(expressApp).delete('/').send({ id });
            expect(synonymService.removeSynonym).toHaveBeenCalledWith(id);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updatedSynonyms);
        });
    });

    describe('GET /lookup/:appId', () => {
        it('returns search results for valid app and term', async () => {
            const appId = 'radarr';
            const term = 'star wars';
            const app = { id: appId, name: 'Radarr' };
            const results = [{ title: 'Star Wars: A New Hope' }];

            (appService.getApp as jest.Mock).mockResolvedValue(app);
            (arrFacade.search as jest.Mock).mockResolvedValue(results);

            const res = await request(expressApp).get(`/lookup/${appId}?term=${encodeURIComponent(term)}`);
            expect(appService.getApp).toHaveBeenCalledWith(appId);
            expect(arrFacade.search).toHaveBeenCalledWith(app, term);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(results);
        });

        it('returns error if app not found', async () => {
            const appId = 'nonexistent';
            (appService.getApp as jest.Mock).mockResolvedValue(undefined);

            const res = await request(expressApp).get(`/lookup/${appId}`);
            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                error: ApiError.INTERNAL_ERROR,
                message: expect.stringContaining('App nonexistent not found'),
            });
        });

        it('returns error if arrFacade.search throws', async () => {
            const appId = 'radarr';
            const term = 'error test';
            const app = { id: appId, name: 'Radarr' };

            (appService.getApp as jest.Mock).mockResolvedValue(app);
            (arrFacade.search as jest.Mock).mockRejectedValue(new Error('Something broke'));

            const res = await request(expressApp).get(`/lookup/${appId}?term=${encodeURIComponent(term)}`);
            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                error: ApiError.INTERNAL_ERROR,
                message: 'Something broke',
            });
        });
    });
});
