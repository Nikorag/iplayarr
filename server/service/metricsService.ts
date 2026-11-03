export type SearchSource = 'native' | 'get_iplayer';
export type DownloadOutcome = 'completed' | 'failed' | 'cancelled';
export type RefreshOutcome = 'success' | 'error';

export interface LastEvent {
    at: number;
    ok: boolean;
    error?: string;
}

export interface MetricSample {
    labels?: Record<string, string>;
    value: number;
}

export interface MetricFamily {
    name: string;
    help: string;
    type: 'counter' | 'gauge';
    samples: MetricSample[];
}

const escapeLabel = (value: string): string => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');

const formatSample = (name: string, { labels, value }: MetricSample): string => {
    const entries = Object.entries(labels ?? {});
    const labelString = entries.length ? `{${entries.map(([k, v]) => `${k}="${escapeLabel(v)}"`).join(',')}}` : '';
    return `${name}${labelString} ${value}`;
};

/** Renders metric families in the Prometheus text exposition format. */
export const formatMetrics = (families: MetricFamily[]): string =>
    families
        .map(({ name, help, type, samples }) =>
            [`# HELP ${name} ${help}`, `# TYPE ${name} ${type}`, ...samples.map((s) => formatSample(name, s))].join(
                '\n'
            )
        )
        .join('\n') + '\n';

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * In-process counters and "last event" state, fed by the facades and read by both the /metrics endpoint and the
 * diagnostics page. Held in memory only, so everything resets on restart (as Prometheus counters are expected to).
 */
class MetricsService {
    private searches = new Map<string, number>();
    private searchSeconds = new Map<SearchSource, number>();
    private downloads = new Map<DownloadOutcome, number>();
    private refreshes = new Map<RefreshOutcome, number>();
    private upstreamErrors = new Map<string, number>();

    private last: { search?: LastEvent; download?: LastEvent; refresh?: LastEvent } = {};
    private lastSuccess: { search?: number; download?: number } = {};

    recordSearch(source: SearchSource, durationMs: number, error?: unknown): void {
        const outcome = error === undefined ? 'success' : 'error';
        const key = `${source}|${outcome}`;
        this.searches.set(key, (this.searches.get(key) ?? 0) + 1);
        this.searchSeconds.set(source, (this.searchSeconds.get(source) ?? 0) + durationMs / 1000);
        this.last.search = {
            at: Date.now(),
            ok: outcome == 'success',
            error: error === undefined ? undefined : errorMessage(error),
        };
        if (outcome == 'success') {
            this.lastSuccess.search = this.last.search.at;
        }
    }

    recordDownload(outcome: DownloadOutcome, error?: string): void {
        this.downloads.set(outcome, (this.downloads.get(outcome) ?? 0) + 1);
        // A cancellation is the user's doing, so it says nothing about whether downloads are healthy
        if (outcome != 'cancelled') {
            this.last.download = { at: Date.now(), ok: outcome == 'completed', error };
            if (outcome == 'completed') {
                this.lastSuccess.download = this.last.download.at;
            }
        }
    }

    recordRefresh(error?: unknown): void {
        const outcome: RefreshOutcome = error === undefined ? 'success' : 'error';
        this.refreshes.set(outcome, (this.refreshes.get(outcome) ?? 0) + 1);
        this.last.refresh = {
            at: Date.now(),
            ok: outcome == 'success',
            error: error === undefined ? undefined : errorMessage(error),
        };
    }

    /** Failures the app absorbs (e.g. the BBC search API erroring) and so never surface as a failed search. */
    recordUpstreamError(service: string): void {
        this.upstreamErrors.set(service, (this.upstreamErrors.get(service) ?? 0) + 1);
    }

    getLastEvents() {
        return { ...this.last };
    }

    collect(): MetricFamily[] {
        const searchSamples = (): MetricSample[] =>
            [...this.searches].map(([key, value]) => {
                const [source, outcome] = key.split('|');
                return { labels: { source, outcome }, value };
            });

        return [
            {
                name: 'iplayarr_searches_total',
                help: 'Searches run against iPlayer, by search backend and outcome.',
                type: 'counter',
                samples: searchSamples(),
            },
            {
                name: 'iplayarr_search_duration_seconds_total',
                help: 'Total time spent searching iPlayer, by search backend.',
                type: 'counter',
                samples: [...this.searchSeconds].map(([source, value]) => ({ labels: { source }, value })),
            },
            {
                name: 'iplayarr_downloads_total',
                help: 'Downloads that have finished, by outcome.',
                type: 'counter',
                samples: [...this.downloads].map(([outcome, value]) => ({ labels: { outcome }, value })),
            },
            {
                name: 'iplayarr_index_refreshes_total',
                help: 'Schedule index refreshes, by outcome.',
                type: 'counter',
                samples: [...this.refreshes].map(([outcome, value]) => ({ labels: { outcome }, value })),
            },
            {
                name: 'iplayarr_upstream_errors_total',
                help: 'Errors from upstream services that were handled without failing the request.',
                type: 'counter',
                samples: [...this.upstreamErrors].map(([service, value]) => ({ labels: { service }, value })),
            },
            {
                name: 'iplayarr_last_search_success_timestamp_seconds',
                help: 'Unix time of the last successful search.',
                type: 'gauge',
                samples: this.#timestampSample(this.lastSuccess.search),
            },
            {
                name: 'iplayarr_last_download_success_timestamp_seconds',
                help: 'Unix time of the last successful download.',
                type: 'gauge',
                samples: this.#timestampSample(this.lastSuccess.download),
            },
        ];
    }

    // Only reports a value once there has been a success, so an alert on `time() - metric` doesn't fire at startup
    #timestampSample(at?: number): MetricSample[] {
        return at ? [{ value: Math.floor(at / 1000) }] : [];
    }

    /** Test hook. */
    reset(): void {
        this.searches.clear();
        this.searchSeconds.clear();
        this.downloads.clear();
        this.refreshes.clear();
        this.upstreamErrors.clear();
        this.last = {};
        this.lastSuccess = {};
    }
}

export default new MetricsService();
