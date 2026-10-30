import metricsService, { formatMetrics } from '../../server/service/metricsService';

describe('metricsService', () => {
    beforeEach(() => metricsService.reset());

    const samples = (name: string) => metricsService.collect().find((f) => f.name == name)?.samples;

    it('counts searches by source and outcome and accumulates duration', () => {
        metricsService.recordSearch('native', 500);
        metricsService.recordSearch('native', 1500);
        metricsService.recordSearch('get_iplayer', 100, new Error('boom'));

        expect(samples('iplayarr_searches_total')).toEqual([
            { labels: { source: 'native', outcome: 'success' }, value: 2 },
            { labels: { source: 'get_iplayer', outcome: 'error' }, value: 1 },
        ]);
        expect(samples('iplayarr_search_duration_seconds_total')).toEqual([
            { labels: { source: 'native' }, value: 2 },
            { labels: { source: 'get_iplayer' }, value: 0.1 },
        ]);
        expect(metricsService.getLastEvents().search).toMatchObject({ ok: false, error: 'boom' });
    });

    it('only reports a last-success timestamp once something has succeeded', () => {
        metricsService.recordSearch('native', 10, new Error('boom'));
        expect(samples('iplayarr_last_search_success_timestamp_seconds')).toEqual([]);

        metricsService.recordSearch('native', 10);
        expect(samples('iplayarr_last_search_success_timestamp_seconds')).toHaveLength(1);
    });

    it('does not let a cancelled download change the last download result', () => {
        metricsService.recordDownload('completed');
        metricsService.recordDownload('cancelled');

        expect(metricsService.getLastEvents().download?.ok).toBe(true);
        expect(samples('iplayarr_downloads_total')).toEqual([
            { labels: { outcome: 'completed' }, value: 1 },
            { labels: { outcome: 'cancelled' }, value: 1 },
        ]);
    });

    it('records failed downloads with their reason', () => {
        metricsService.recordDownload('failed', 'Exited with code 1');

        expect(metricsService.getLastEvents().download).toMatchObject({ ok: false, error: 'Exited with code 1' });
    });

    it('records refreshes and upstream errors', () => {
        metricsService.recordRefresh();
        metricsService.recordRefresh('nope');
        metricsService.recordUpstreamError('bbc_search');

        expect(samples('iplayarr_index_refreshes_total')).toEqual([
            { labels: { outcome: 'success' }, value: 1 },
            { labels: { outcome: 'error' }, value: 1 },
        ]);
        expect(samples('iplayarr_upstream_errors_total')).toEqual([{ labels: { service: 'bbc_search' }, value: 1 }]);
        expect(metricsService.getLastEvents().refresh).toMatchObject({ ok: false, error: 'nope' });
    });
});

describe('formatMetrics', () => {
    it('renders the Prometheus text format with escaped labels', () => {
        const output = formatMetrics([
            {
                name: 'test_total',
                help: 'A test.',
                type: 'counter',
                samples: [{ labels: { name: 'a "quoted"\nvalue\\' }, value: 3 }, { value: 1 }],
            },
            { name: 'empty', help: 'Nothing.', type: 'gauge', samples: [] },
        ]);

        expect(output).toBe(
            [
                '# HELP test_total A test.',
                '# TYPE test_total counter',
                'test_total{name="a \\"quoted\\"\\nvalue\\\\"} 3',
                'test_total 1',
                '# HELP empty Nothing.',
                '# TYPE empty gauge',
                '',
            ].join('\n')
        );
    });
});
