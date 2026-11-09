import request from 'supertest';

import { SqliteDriver } from '../../server/db/sqliteDriver';
import generateToken from '../../server/routes/auth/generateToken.get';
import login from '../../server/routes/auth/login.post';
import logout from '../../server/routes/auth/logout.get';
import me from '../../server/routes/auth/me.get';
import method from '../../server/routes/auth/method.get';
import resetPassword from '../../server/routes/auth/resetPassword.post';
import configService from '../../server/service/configService';
import { IplayarrParameter } from '../../server/types/IplayarrParameters';
import { ApiError } from '../../server/types/responses/ApiResponse';
import * as Utils from '../../server/utils/Utils';
import { nodeApp } from '../helpers/h3';

let driver: SqliteDriver;

jest.mock('../../server/db/database', () => ({ getDatabase: () => Promise.resolve(driver) }));
jest.mock('../../server/service/configService');
jest.mock('uuid', () => ({ v4: () => 'mock-token' }));
jest.mock('openid-client', () => {});

// Bcrypt hash of 'password' (pre-computed for deterministic tests)
const BCRYPT_HASH_PASSWORD = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

describe('AuthRoute', () => {
    let app: ReturnType<typeof nodeApp>;

    beforeEach(() => {
        jest.restoreAllMocks();
        driver = new SqliteDriver(':memory:', 'drizzle/sqlite');

        app = nodeApp([
            ['get', '/method', method],
            ['post', '/login', login],
            ['get', '/logout', logout],
            ['get', '/me', me],
            ['get', '/generateToken', generateToken],
            ['post', '/resetPassword', resetPassword],
        ]);
    });

    afterEach(() => driver.close());

    describe('GET /method', () => {
        it('returns the configured auth type', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('oidc');

            const res = await request(app).get('/method');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'oidc' });
        });
    });

    describe('POST /login', () => {
        it('should login successfully with bcrypt-hashed password', async () => {
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('admin') // AUTH_USERNAME
                .mockResolvedValueOnce(BCRYPT_HASH_PASSWORD); // AUTH_PASSWORD

            jest.spyOn(Utils, 'isLegacyMD5Hash').mockReturnValue(false);
            jest.spyOn(Utils, 'comparePassword').mockResolvedValue(true);

            const res = await request(app).post('/login').send({
                username: 'admin',
                password: 'password',
            });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: true });
            expect(Utils.comparePassword).toHaveBeenCalledWith('password', BCRYPT_HASH_PASSWORD);
            expect(res.headers['set-cookie'][0]).toMatch(/^iplayarr\.sid=[a-f0-9]{64}; .*HttpOnly/);
        });

        it('should login with legacy MD5 hash and migrate to bcrypt', async () => {
            const legacyMD5 = '5f4dcc3b5aa765d61d8327deb882cf99';
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('admin') // AUTH_USERNAME
                .mockResolvedValueOnce(legacyMD5); // AUTH_PASSWORD (MD5 of 'password')

            jest.spyOn(Utils, 'isLegacyMD5Hash').mockReturnValue(true);
            jest.spyOn(Utils, 'md5').mockReturnValue(legacyMD5);
            jest.spyOn(Utils, 'hashPassword').mockResolvedValue(BCRYPT_HASH_PASSWORD);
            (configService.setParameter as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app).post('/login').send({
                username: 'admin',
                password: 'password',
            });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: true });
            // Should have migrated the password to bcrypt
            expect(Utils.hashPassword).toHaveBeenCalledWith('password');
            expect(configService.setParameter).toHaveBeenCalledWith(
                IplayarrParameter.AUTH_PASSWORD,
                BCRYPT_HASH_PASSWORD
            );
        });

        it('should fail login with incorrect credentials (bcrypt)', async () => {
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('admin')
                .mockResolvedValueOnce(BCRYPT_HASH_PASSWORD);

            jest.spyOn(Utils, 'isLegacyMD5Hash').mockReturnValue(false);
            jest.spyOn(Utils, 'comparePassword').mockResolvedValue(false);

            const res = await request(app).post('/login').send({
                username: 'admin',
                password: 'wrongpassword',
            });

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: ApiError.INVALID_CREDENTIALS });
            expect(res.headers['set-cookie']).toBeUndefined();
        });

        it('should fail login with incorrect credentials (legacy MD5)', async () => {
            const legacyMD5 = '5f4dcc3b5aa765d61d8327deb882cf99';
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('admin').mockResolvedValueOnce(legacyMD5);

            jest.spyOn(Utils, 'isLegacyMD5Hash').mockReturnValue(true);
            jest.spyOn(Utils, 'md5').mockReturnValue('different_hash');

            const res = await request(app).post('/login').send({
                username: 'admin',
                password: 'wrongpassword',
            });

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: ApiError.INVALID_CREDENTIALS });
        });

        it('should fail login with wrong username', async () => {
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('admin')
                .mockResolvedValueOnce(BCRYPT_HASH_PASSWORD);

            const res = await request(app).post('/login').send({
                username: 'wrong',
                password: 'password',
            });

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: ApiError.INVALID_CREDENTIALS });
        });
    });

    describe('GET /logout', () => {
        it('should succeed when there is no session', async () => {
            await request(app).get('/logout').expect(200, { status: true });
        });

        it('should destroy the stored session on logout', async () => {
            const agent = request.agent(app);

            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('admin')
                .mockResolvedValueOnce(BCRYPT_HASH_PASSWORD);
            jest.spyOn(Utils, 'isLegacyMD5Hash').mockReturnValue(false);
            jest.spyOn(Utils, 'comparePassword').mockResolvedValue(true);

            const loginRes = await agent.post('/login').send({ username: 'admin', password: 'any' });
            const sid = /iplayarr\.sid=([a-f0-9]+)/.exec(loginRes.headers['set-cookie'][0])![1];
            expect(await driver.sessionGet(sid)).toBeDefined();

            await agent.get('/logout').expect(200, { status: true });

            expect(await driver.sessionGet(sid)).toBeUndefined();
            expect((await agent.get('/me')).status).toBe(401);
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
                .mockResolvedValueOnce(BCRYPT_HASH_PASSWORD);

            jest.spyOn(Utils, 'isLegacyMD5Hash').mockReturnValue(false);
            jest.spyOn(Utils, 'comparePassword').mockResolvedValue(true);

            await agent.post('/login').send({ username: 'admin', password: 'any' });
            const res = await agent.get('/me');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ username: 'admin' });
        });

        it('should return the configured user without a session when AUTH_TYPE is none', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('none').mockResolvedValueOnce('haven');

            const res = await request(app).get('/me');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ username: 'haven' });
        });

        it('should ignore a cookie for a session that does not exist', async () => {
            const res = await request(app).get('/me').set('Cookie', 'iplayarr.sid=deadbeef');
            expect(res.status).toBe(401);
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
                AUTH_PASSWORD: '5f4dcc3b5aa765d61d8327deb882cf99',
            };

            const res2 = await request(app).post('/resetPassword').send({ key: 'mock-token' });
            expect(res2.status).toBe(200);
            expect(res2.body).toEqual({ status: true });
            expect(configService.setParameter).toHaveBeenCalledWith(IplayarrParameter.AUTH_USERNAME, 'admin');
            expect(configService.setParameter).toHaveBeenCalledWith(
                IplayarrParameter.AUTH_PASSWORD,
                '5f4dcc3b5aa765d61d8327deb882cf99'
            );
        });

        it('should do nothing if token is invalid', async () => {
            const res = await request(app).post('/resetPassword').send({ key: 'invalid' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: true });
        });
    });
});
