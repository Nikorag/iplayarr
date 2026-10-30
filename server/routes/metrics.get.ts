import { defineEventHandler, getHeader, getQuery, setHeader, setResponseStatus } from 'h3';

import { version } from '../config/version.json';
import sessionService from '../service/auth/sessionService';
import configService from '../service/configService';
import metricsService, { formatMetrics, MetricFamily } from '../service/metricsService';
import queueService from '../service/queueService';
import StatisticsService from '../service/stats/StatisticsService';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { QueueEntryStatus } from '../types/responses/sabnzbd/QueueResponse';

const isAuthorised = async (event: Parameters<typeof sessionService.getUser>[0]): Promise<boolean> => {
    // Prometheus can't log in, so accept the API key as `?apikey=` or as a bearer token, as well as a normal session
    const apiKey = await configService.getParameter(IplayarrParameter.API_KEY);
    const bearer = getHeader(event, 'authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    const provided = (getQuery(event).apikey as string | undefined) ?? bearer;
    if (apiKey && provided === apiKey) {
        return true;
    }
    return Boolean(await sessionService.getUser(event));
};

export default defineEventHandler(async (event) => {
    if (!(await isAuthorised(event))) {
        setResponseStatus(event, 401);
        return 'Unauthorised\n';
    }

    const queue = queueService.getQueue();
    const queueSamples = [QueueEntryStatus.DOWNLOADING, QueueEntryStatus.QUEUED].map((status) => ({
        labels: { status: status.toLowerCase() },
        value: queue.filter((entry) => entry.status == status).length,
    }));

    const families: MetricFamily[] = [
        {
            name: 'iplayarr_info',
            help: 'iPlayarr build information.',
            type: 'gauge',
            samples: [{ labels: { version }, value: 1 }],
        },
        {
            name: 'iplayarr_uptime_seconds',
            help: 'Seconds since iPlayarr started.',
            type: 'gauge',
            samples: [{ value: Math.floor((await StatisticsService.getUptime()) / 1000) }],
        },
        {
            name: 'iplayarr_queue_items',
            help: 'Items in the download queue, by status.',
            type: 'gauge',
            samples: queueSamples,
        },
        ...metricsService.collect(),
        {
            name: 'process_resident_memory_bytes',
            help: 'Resident memory size in bytes.',
            type: 'gauge',
            samples: [{ value: process.memoryUsage().rss }],
        },
    ];

    setHeader(event, 'Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return formatMetrics(families);
});
