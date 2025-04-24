import express from 'express';
import SettingsRoute from 'src/routes/json-api/SettingsRoute';
import configService from 'src/service/configService';
import { qualityProfiles } from 'src/types/QualityProfiles';
import request from 'supertest';

jest.mock('src/service/configService');
const mockedConfigService = jest.mocked(configService);

describe('SettingsRoute', () => {
    const app = express();
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

    describe('GET /qualityProfiles', () => {
        it('returns quality profiles from const', async () => {
            const response = await request(app).get('/qualityProfiles');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(qualityProfiles);
        });
    });
});
