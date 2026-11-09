import request from 'supertest';

import metricsRoute from '../../server/routes/metrics.get';
import sessionService from '../../server/service/auth/sessionService';
import configService from '../../server/service/configService';
import metricsService from '../../server/service/metricsService';
import queueService from '../../server/service/queueService';
import { QueueEntryStatus } from '../../server/types/responses/sabnzbd/QueueResponse';
import { nodeApp } from '../helpers/h3';

jest.mock('../../server/service/auth/sessionService');
jest.mock('../../server/service/configService');
jest.mock('../../server/service/queueService');

const app = nodeApp([['get', '/metrics', metricsRoute]]);

describe('GET /metrics', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        metricsService.reset();
        (configService.getParameter as jest.Mock).mockResolvedValue('secret');
        (sessionService.getUser as jest.Mock).mockResolvedValue(undefined);
        (queueService.getQueue as jest.Mock).mockReturnValue([
            { pid: 'a', status: QueueEntryStatus.DOWNLOADING },
            { pid: 'b', status: QueueEntryStatus.QUEUED },
            { pid: 'c', status: QueueEntryStatus.QUEUED },
        ]);
    });

    it('rejects requests with no credentials', async () => {
        const res = await request(app).get('/metrics');

        expect(res.status).toBe(401);
    });

    it('rejects a wrong API key', async () => {
        const res = await request(app).get('/metrics?apikey=wrong');

        expect(res.status).toBe(401);
    });

    it('accepts the API key as a query parameter', async () => {
        const res = await request(app).get('/metrics?apikey=secret');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/plain');
    });

    it('accepts the API key as a bearer token', async () => {
        const res = await request(app).get('/metrics').set('Authorization', 'Bearer secret');

        expect(res.status).toBe(200);
    });

    it('accepts a logged in user, including when auth is disabled', async () => {
        (sessionService.getUser as jest.Mock).mockResolvedValue({ username: 'admin' });

        const res = await request(app).get('/metrics');

        expect(res.status).toBe(200);
    });

    it('does not accept an empty API key when none is configured', async () => {
        (configService.getParameter as jest.Mock).mockResolvedValue(undefined);

        const res = await request(app).get('/metrics?apikey=');

        expect(res.status).toBe(401);
    });

    it('exposes queue, counters and process gauges', async () => {
        metricsService.recordSearch('native', 250);
        metricsService.recordDownload('completed');

        const res = await request(app).get('/metrics?apikey=secret');

        expect(res.text).toContain('iplayarr_queue_items{status="downloading"} 1');
        expect(res.text).toContain('iplayarr_queue_items{status="queued"} 2');
        expect(res.text).toContain('iplayarr_searches_total{source="native",outcome="success"} 1');
        expect(res.text).toContain('iplayarr_downloads_total{outcome="completed"} 1');
        expect(res.text).toContain('iplayarr_uptime_seconds ');
        expect(res.text).toContain('process_resident_memory_bytes ');
        expect(res.text).toMatch(/iplayarr_info\{version="[^"]+"\} 1/);
    });
});
