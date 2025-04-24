import express from 'express';
import SettingsRoute from 'src/routes/json-api/SettingsRoute';
import request from 'supertest';

describe('SettingsRoute', () => {
    const app = express();
    app.use('/', SettingsRoute);

    describe('/hiddenSettings', () => {
        beforeEach(() => {
            delete process.env.HIDE_DONATE;
        });

        it('returns hidden settings', async () => {
            const result = await request(app).get('/hiddenSettings');
            expect(result.body).toEqual({
                HIDE_DONATE: false,
                VERSION: 'development',
            });
        });

        it('reads HIDE_DONATE from env variable', async () => {
            process.env.HIDE_DONATE = 'true';
            const result = await request(app).get('/hiddenSettings');
            expect(result.body.HIDE_DONATE).toBe(true);
        });
    });
});
