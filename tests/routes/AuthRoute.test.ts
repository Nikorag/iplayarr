import express from 'express';
import session from 'express-session';
import request from 'supertest';

import AuthRoute, { addAuthMiddleware } from '../../src/routes/AuthRoute';
import configService from '../../src/service/configService';
import { IplayarrParameter } from '../../src/types/IplayarrParameters';
import { ApiError } from '../../src/types/responses/ApiResponse';
import { md5 } from '../../src/utils/Utils';
import * as Utils from '../../src/utils/Utils';

jest.mock('../../src/service/configService');
jest.spyOn(Utils, 'md5').mockReturnValue('hashed');
jest.mock('uuid', () => ({ v4: () => 'mock-token' }));
jest.mock('openid-client', () => { });

describe('AuthRoute', () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Minimal in-memory session
        app.use(
            session({
                secret: 'test',
                resave: false,
                saveUninitialized: false,
            })
        );

        addAuthMiddleware(app);
        app.use('/', AuthRoute);
    });

    describe('POST /login', () => {
        it('should login successfully with correct credentials', async () => {
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('admin') // AUTH_USERNAME
                .mockResolvedValueOnce('hashed'); // AUTH_PASSWORD
            (md5 as jest.Mock).mockReturnValue('hashed');

            const res = await request(app).post('/login').send({
                username: 'admin',
                password: 'password',
            });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: true });
        });

        it('should fail login with incorrect credentials', async () => {
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('admin')
                .mockResolvedValueOnce('hashed');
            (md5 as jest.Mock).mockReturnValue('wrong');

            const res = await request(app).post('/login').send({
                username: 'admin',
                password: 'wrongpassword',
            });

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: ApiError.INVALID_CREDENTIALS });
        });
    });

    describe('GET /logout', () => {
        it('should destroy session on logout', async () => {
            const agent = request.agent(app);
            await agent.get('/logout').expect(200, { status: true });
        });
    });

    describe('GET /me', () => {
        it('should return 401 if user not logged in', async () => {
            const res = await request(app).get('/me');
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: ApiError.NOT_AUTHORISED });
        });

        it('should return user info if logged in', async () => {
            const agent = request.agent(app);

            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('admin')
                .mockResolvedValueOnce('hashed');
            (md5 as jest.Mock).mockReturnValue('hashed');

            await agent.post('/login').send({ username: 'admin', password: 'any' });
            const res = await agent.get('/me');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ username: 'admin' });
        });
    });

    describe('GET /generateToken', () => {
        it('should generate a token and return success', async () => {
            const res = await request(app).get('/generateToken');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: true });
        });
    });

    describe('POST /resetPassword', () => {
        it('should reset password if token matches', async () => {
            const res1 = await request(app).get('/generateToken');
            expect(res1.body).toEqual({ status: true });

            (configService.setParameter as jest.Mock).mockResolvedValue(undefined);
            (configService.defaultConfigMap as any) = {
                AUTH_USERNAME: 'admin',
                AUTH_PASSWORD: 'hashed',
            };

            const res2 = await request(app).post('/resetPassword').send({ key: 'mock-token' });
            expect(res2.status).toBe(200);
            expect(res2.body).toEqual({ status: true });
            expect(configService.setParameter).toHaveBeenCalledWith(IplayarrParameter.AUTH_USERNAME, 'admin');
            expect(configService.setParameter).toHaveBeenCalledWith(IplayarrParameter.AUTH_PASSWORD, 'hashed');
        });

        it('should do nothing if token is invalid', async () => {
            const res = await request(app).post('/resetPassword').send({ key: 'invalid' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: true });
        });
    });
});
