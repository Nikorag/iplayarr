import express from 'express';
import SettingsRoute from '../../../src/routes/json-api/SettingsRoute';
import configService from '../../../src/service/configService';
import { qualityProfiles } from '../../../src/types/QualityProfiles';
import { ApiError, ApiResponse } from '../../../src/types/responses/ApiResponse';
import { ConfigFormValidator } from '../../../src/validators/ConfigFormValidator';
import request from 'supertest';

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

        it('MD5 hashes AUTH_PASSWORD if included and different from existing value', async () => {
            mockedConfigFormValidator.validate.mockResolvedValue({});
            mockedConfigService.setParameter.mockResolvedValue();
            mockedConfigService.getParameter.mockResolvedValueOnce('FUBAR');
            const body = { AUTH_PASSWORD: 'FOOBAR' };
            const response = await request(app).put('/').send(body);
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(body);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledTimes(1);
            expect(mockedConfigFormValidator.validate).toHaveBeenCalledWith(body);
            expect(mockedConfigService.getParameter).toHaveBeenCalledTimes(1);
            expect(mockedConfigService.getParameter).toHaveBeenCalledWith('AUTH_PASSWORD');
            expect(mockedConfigService.setParameter).toHaveBeenCalledTimes(1);
            expect(mockedConfigService.setParameter).toHaveBeenCalledWith(
                'AUTH_PASSWORD',
                '95c72a49c488d59f60c022fcfecf4382'
            );
        });

        it('does not update AUTH_PASSWORD if included and same as existing value', async () => {
            mockedConfigFormValidator.validate.mockResolvedValue({});
            mockedConfigService.setParameter.mockResolvedValue();
            mockedConfigService.getParameter.mockResolvedValueOnce('95c72a49c488d59f60c022fcfecf4382');
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
    });

    describe('GET /qualityProfiles', () => {
        it('returns quality profiles from const', async () => {
            const response = await request(app).get('/qualityProfiles');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(qualityProfiles);
        });
    });
});
