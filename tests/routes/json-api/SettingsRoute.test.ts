import express from 'express';
import request from 'supertest';

import SettingsRoute from '../../../src/routes/json-api/SettingsRoute';
import configService from '../../../src/service/configService';
import { qualityProfiles } from '../../../src/types/QualityProfiles';
import { ApiError, ApiResponse } from '../../../src/types/responses/ApiResponse';
import * as Utils from '../../../src/utils/Utils';
import { ConfigFormValidator } from '../../../src/validators/ConfigFormValidator';

jest.mock('../../../src/service/configService');
const mockedConfigService = jest.mocked(configService);

const mockedConfigFormValidator: jest.Mocked<ConfigFormValidator> = {
    validate: jest.fn(),
    compilesSuccessfully: jest.fn(),
    directoryExists: jest.fn(),
    isNumber: jest.fn(),
    matchesRegex: jest.fn(),
};
jest.mock('../../../src/validators/ConfigFormValidator', () => ({
    ConfigFormValidator: jest.fn(() => mockedConfigFormValidator),
}));

describe('SettingsRoute', () => {
    const app = express();
    app.use(express.json());
    app.use('/', SettingsRoute);

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('GET /hiddenSettings', () => {
        beforeEach(() => {
            delete process.env.HIDE_DONATE;
        });

        it('returns hidden settings', async () => {
            const response = await request(app).get('/hiddenSettings');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({
                HIDE_DONATE: false,
                VERSION: 'development',
            });
        });

        it('reads HIDE_DONATE from env variable', async () => {
            process.env.HIDE_DONATE = 'true';
            const response = await request(app).get('/hiddenSettings');
            expect(response.statusCode).toBe(200);
            expect(response.body.HIDE_DONATE).toBe(true);
        });
    });

    describe('GET /', () => {
        it('returns config from service', async () => {
            mockedConfigService.getAllConfig.mockResolvedValue(configService.defaultConfigMap);
            const response = await request(app).get('/');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(configService.defaultConfigMap);
        });
    });

    describe('PUT /', () => {
        it('saves if body valid', async () => {
            mockedConfigFormValidator.validate.mockResolvedValue({});
            mockedConfigService.setParameter.mockResolvedValue();
            const body = { FOO: 'BAR', BAZ: 'QUX' };
            const response = await request(app).put('/').send(body);
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(body);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledTimes(1);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledWith(body);
            expect(mockedConfigService.setParameter).toHaveBeenCalledTimes(2);
            expect(mockedConfigService.setParameter).toHaveBeenCalledWith('FOO', 'BAR');
            expect(mockedConfigService.setParameter).toHaveBeenCalledWith('BAZ', 'QUX');
        });

        it('errors if body is invalid', async () => {
            const validation_result = { FOO: 'Must be BAR', BAZ: 'Must be QUX' };
            mockedConfigFormValidator.validate.mockResolvedValue(validation_result);
            const body = { FOO: 'FOOBAR', BAZ: 'QUUX' };
            const response = await request(app).put('/').send(body);
            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({
                error: ApiError.INVALID_INPUT,
                invalid_fields: validation_result,
            } as ApiResponse);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledTimes(1);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledWith(body);
            expect(mockedConfigService.setParameter).not.toHaveBeenCalled();
        });

        it('bcrypt hashes AUTH_PASSWORD if included and different from existing value', async () => {
            const bcryptHash = '$2b$10$mockedbcrypthashvalue1234567890abcdefghijklmnop';
            mockedConfigFormValidator.validate.mockResolvedValue({});
            mockedConfigService.setParameter.mockResolvedValue();
            mockedConfigService.getParameter.mockResolvedValueOnce('existing_hash');
            jest.spyOn(Utils, 'isLegacyMD5Hash').mockReturnValue(false);
            jest.spyOn(Utils, 'comparePassword').mockResolvedValue(false);
            jest.spyOn(Utils, 'hashPassword').mockResolvedValue(bcryptHash);

            const body = { AUTH_PASSWORD: 'FOOBAR' };
            const response = await request(app).put('/').send(body);
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(body);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledTimes(1);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledWith(body);
            expect(mockedConfigService.getParameter).toHaveBeenCalledTimes(1);
            expect(mockedConfigService.getParameter).toHaveBeenCalledWith('AUTH_PASSWORD');
            expect(Utils.hashPassword).toHaveBeenCalledWith('FOOBAR');
            expect(mockedConfigService.setParameter).toHaveBeenCalledTimes(1);
            expect(mockedConfigService.setParameter).toHaveBeenCalledWith('AUTH_PASSWORD', bcryptHash);
        });

        it('does not update AUTH_PASSWORD if plaintext matches existing bcrypt hash', async () => {
            mockedConfigFormValidator.validate.mockResolvedValue({});
            mockedConfigService.setParameter.mockResolvedValue();
            mockedConfigService.getParameter.mockResolvedValueOnce('$2b$10$existinghash');
            jest.spyOn(Utils, 'isLegacyMD5Hash').mockReturnValue(false);
            jest.spyOn(Utils, 'comparePassword').mockResolvedValue(true);

            const body = { AUTH_PASSWORD: 'FOOBAR' };
            const response = await request(app).put('/').send(body);
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(body);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledTimes(1);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledWith(body);
            expect(mockedConfigService.getParameter).toHaveBeenCalledTimes(1);
            expect(mockedConfigService.getParameter).toHaveBeenCalledWith('AUTH_PASSWORD');
            expect(mockedConfigService.setParameter).not.toHaveBeenCalled();
        });

        it('does not update AUTH_PASSWORD if plaintext matches existing legacy MD5 hash', async () => {
            const legacyMD5 = '5f4dcc3b5aa765d61d8327deb882cf99';
            mockedConfigFormValidator.validate.mockResolvedValue({});
            mockedConfigService.setParameter.mockResolvedValue();
            mockedConfigService.getParameter.mockResolvedValueOnce(legacyMD5);
            jest.spyOn(Utils, 'isLegacyMD5Hash').mockReturnValue(true);
            jest.spyOn(Utils, 'md5').mockReturnValue(legacyMD5);

            const body = { AUTH_PASSWORD: 'password' };
            const response = await request(app).put('/').send(body);
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(body);
            expect(mockedConfigService.setParameter).not.toHaveBeenCalled();
        });

        it('does not update AUTH_PASSWORD if submitted value is the stored hash itself', async () => {
            const storedHash = '$2b$10$existinghash';
            mockedConfigFormValidator.validate.mockResolvedValue({});
            mockedConfigService.setParameter.mockResolvedValue();
            mockedConfigService.getParameter.mockResolvedValueOnce(storedHash);

            const body = { AUTH_PASSWORD: storedHash };
            const response = await request(app).put('/').send(body);
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(body);
            expect(mockedConfigService.setParameter).not.toHaveBeenCalled();
        });
    });

    describe('GET /qualityProfiles', () => {
        it('returns quality profiles from const', async () => {
            const response = await request(app).get('/qualityProfiles');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(qualityProfiles);
        });
    });
});
