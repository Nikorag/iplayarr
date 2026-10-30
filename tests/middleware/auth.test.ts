import { createApp, defineEventHandler, toNodeListener } from 'h3';
import request from 'supertest';

import authMiddleware from '../../server/middleware/auth';
import sessionService from '../../server/service/auth/sessionService';
import { ApiError } from '../../server/types/responses/ApiResponse';


jest.mock('../../server/service/auth/sessionService');

const buildApp = () => {
    const app = createApp();
    app.use(authMiddleware);
    app.use('/json-api/thing', defineEventHandler(() => ({ ok: true })));
    app.use('/auth/thing', defineEventHandler(() => ({ ok: true })));
    return toNodeListener(app);
};

describe('auth middleware', () => {
    it('rejects unauthenticated json-api requests', async () => {
        (sessionService.getUser as jest.Mock).mockResolvedValue(undefined);

        const res = await request(buildApp()).get('/json-api/thing');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: ApiError.NOT_AUTHORISED });
    });

    it('lets authenticated json-api requests through', async () => {
        (sessionService.getUser as jest.Mock).mockResolvedValue({ username: 'admin' });

        const res = await request(buildApp()).get('/json-api/thing');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });

    it('does not check the session for other routes', async () => {
        (sessionService.getUser as jest.Mock).mockResolvedValue(undefined);

        const res = await request(buildApp()).get('/auth/thing');

        expect(res.status).toBe(200);
        expect(sessionService.getUser).not.toHaveBeenCalled();
    });
});
