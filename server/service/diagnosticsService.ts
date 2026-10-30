import axios from 'axios';
import { execFile } from 'child_process';
import fs from 'fs/promises';

import { version } from '../config/version.json';
import { getDatabase } from '../db/database';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { QueueEntryStatus } from '../types/responses/sabnzbd/QueueResponse';
import CacheService from './cache/cacheService';
import configService from './configService';
import getIplayerExecutableService from './getIplayerExecutableService';
import metricsService, { LastEvent } from './metricsService';
import queueService from './queueService';
import StatisticsService from './stats/StatisticsService';

export type CheckStatus = 'ok' | 'warn' | 'error' | 'skipped';

export interface DiagnosticCheck {
    id: string;
    name: string;
    status: CheckStatus;
    message: string;
}

export interface DiagnosticsReport {
    status: Exclude<CheckStatus, 'skipped'>;
    generatedAt: number;
    version: string;
    uptime: number;
    checks: DiagnosticCheck[];
}

const GIB = 1024 ** 3;
const LOW_DISK_WARN_BYTES = 5 * GIB;
const LOW_DISK_ERROR_BYTES = 1 * GIB;
const SLOW_RESPONSE_MS = 3000;
const BBC_SEARCH_URL = 'https://ibl.api.bbc.co.uk/ibl/v1/new-search?q=diagnostics';
const LATEST_RELEASE_URL = 'https://api.github.com/repos/get-iplayer/get_iplayer/releases/latest';

export const latestReleaseCache = new CacheService<string>('diagnostics_latest_get_iplayer', 6 * 60 * 60);

const severity: Record<CheckStatus, number> = { skipped: 0, ok: 0, warn: 1, error: 2 };

const check = (id: string, name: string, status: CheckStatus, message: string): DiagnosticCheck => ({
    id,
    name,
    status,
    message,
});

/** Resolves with stdout and stderr. A non-zero exit rejects unless `tolerateExitCode`, which a timeout or failure to start still does. */
const run = (exec: string, args: string[], { shell = false, tolerateExitCode = false } = {}): Promise<string> =>
    new Promise((resolve, reject) => {
        execFile(exec, args, { shell, timeout: 10000 }, (error, stdout, stderr) => {
            // 126/127 are the shell's "not executable" / "not found", which matter when it ran the command for us
            const exited = error && typeof error.code == 'number' && !error.killed && error.code < 126;
            return error && !(tolerateExitCode && exited) ? reject(error) : resolve(`${stdout}\n${stderr}`);
        });
    });

const compareVersions = (a: string, b: string): number => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff) return diff;
    }
    return 0;
};

const ago = (at: number): string => {
    const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
    if (seconds < 90) return `${seconds}s ago`;
    if (seconds < 90 * 60) return `${Math.round(seconds / 60)}m ago`;
    if (seconds < 36 * 3600) return `${Math.round(seconds / 3600)}h ago`;
    return `${Math.round(seconds / 86400)}d ago`;
};

const latestGetIplayer = async (): Promise<string | undefined> => {
    try {
        const tag = await latestReleaseCache.getOr('latest', async () => {
            const { data } = await axios.get(LATEST_RELEASE_URL, { timeout: 5000 });
            return data.tag_name as string;
        });
        return tag?.replace(/^v/, '');
    } catch {
        return undefined;
    }
};

const activityCheck = (id: string, name: string, event: LastEvent | undefined, none: string): DiagnosticCheck => {
    if (!event) return check(id, name, 'skipped', none);
    return event.ok
        ? check(id, name, 'ok', `Last succeeded ${ago(event.at)}`)
        : check(id, name, 'warn', `Last attempt failed ${ago(event.at)}: ${event.error ?? 'unknown error'}`);
};

const describeError = (error: any): string => {
    if (error?.code == 127) return 'command not found';
    if (error?.code == 126) return 'not executable';
    if (error?.killed) return 'timed out';
    return error?.code ?? error?.message ?? String(error);
};

const diagnosticsService = {
    async checkDatabase(): Promise<DiagnosticCheck> {
        try {
            await (await getDatabase()).ping();
            return check('database', 'Database', 'ok', 'Connected');
        } catch (error: any) {
            return check('database', 'Database', 'error', `Unreachable: ${error?.message ?? error}`);
        }
    },

    async checkGetIplayer(): Promise<DiagnosticCheck> {
        const name = 'get_iplayer';
        try {
            const { exec, args } = await getIplayerExecutableService.getIPlayerExec();
            const output = await run(exec, [...args, '--help'], { shell: true, tolerateExitCode: true });
            const installed = /get_iplayer v?(\d+(?:\.\d+)+)/i.exec(output)?.[1];
            if (!installed) {
                return check('get_iplayer', name, 'ok', 'Installed (version not reported)');
            }
            const latest = await latestGetIplayer();
            if (latest && compareVersions(installed, latest) < 0) {
                return check('get_iplayer', name, 'warn', `v${installed} installed, v${latest} is available`);
            }
            return check('get_iplayer', name, 'ok', `v${installed}${latest ? ' (up to date)' : ''}`);
        } catch (error: any) {
            return check('get_iplayer', name, 'error', `Could not run get_iplayer: ${describeError(error)}`);
        }
    },

    async checkYtdlp(): Promise<DiagnosticCheck> {
        const name = 'yt-dlp';
        if ((await configService.getParameter(IplayarrParameter.DOWNLOAD_CLIENT)) != 'YTDLP') {
            return check('ytdlp', name, 'skipped', 'Not the selected download client');
        }
        const exec = (await configService.getParameter(IplayarrParameter.YTDLP_EXEC)) || 'yt-dlp';
        try {
            return check('ytdlp', name, 'ok', `v${(await run(exec, ['--version'])).trim()}`);
        } catch (error: any) {
            return check('ytdlp', name, 'error', `Could not run yt-dlp: ${describeError(error)}`);
        }
    },

    async checkFfmpeg(): Promise<DiagnosticCheck> {
        const name = 'ffmpeg';
        if ((await configService.getParameter(IplayarrParameter.OUTPUT_FORMAT)) != 'mkv') {
            return check('ffmpeg', name, 'skipped', 'Only needed for MKV output');
        }
        try {
            const banner = (await run('ffmpeg', ['-version'])).split('\n')[0];
            return check('ffmpeg', name, 'ok', banner.replace(/ Copyright.*/, ''));
        } catch (error: any) {
            return check(
                'ffmpeg',
                name,
                'error',
                `MKV output is selected but ffmpeg could not be run: ${describeError(error)}`
            );
        }
    },

    async checkDirectory(id: string, name: string, parameter: IplayarrParameter): Promise<DiagnosticCheck> {
        const dir = await configService.getParameter(parameter);
        if (!dir) {
            return check(id, name, 'error', 'Not configured');
        }
        try {
            await fs.access(dir, fs.constants.W_OK);
        } catch (error: any) {
            return check(id, name, 'error', `${dir} is not writable (${describeError(error)})`);
        }
        try {
            const { bavail, bsize } = await fs.statfs(dir);
            const free = bavail * bsize;
            const message = `${dir}, ${(free / GIB).toFixed(1)} GiB free`;
            if (free < LOW_DISK_ERROR_BYTES) return check(id, name, 'error', `${message} (almost full)`);
            if (free < LOW_DISK_WARN_BYTES) return check(id, name, 'warn', `${message} (running low)`);
            return check(id, name, 'ok', message);
        } catch {
            return check(id, name, 'ok', `${dir} is writable (free space unavailable)`);
        }
    },

    async checkBbc(): Promise<DiagnosticCheck> {
        const name = 'iPlayer API';
        const startedAt = Date.now();
        try {
            await axios.get(BBC_SEARCH_URL, { timeout: 8000 });
            const ms = Date.now() - startedAt;
            return check('bbc', name, ms > SLOW_RESPONSE_MS ? 'warn' : 'ok', `Reachable, responded in ${ms}ms`);
        } catch (error: any) {
            return check('bbc', name, 'error', `Not reachable: ${describeError(error)}`);
        }
    },

    checkActivity(): DiagnosticCheck[] {
        const { search, download, refresh } = metricsService.getLastEvents();
        return [
            activityCheck('search', 'Searches', search, 'None since start-up'),
            activityCheck('download', 'Downloads', download, 'None since start-up'),
            activityCheck('refresh', 'Index refresh', refresh, 'None since start-up'),
        ];
    },

    checkQueue(): DiagnosticCheck {
        const queue = queueService.getQueue();
        const downloading = queue.filter(({ status }) => status == QueueEntryStatus.DOWNLOADING).length;
        const queued = queue.filter(({ status }) => status == QueueEntryStatus.QUEUED).length;
        return check('queue', 'Queue', 'ok', `${downloading} downloading, ${queued} waiting`);
    },

    async getReport(): Promise<DiagnosticsReport> {
        const [database, getIplayer, ytdlp, ffmpeg, download, complete, bbc] = await Promise.all([
            diagnosticsService.checkDatabase(),
            diagnosticsService.checkGetIplayer(),
            diagnosticsService.checkYtdlp(),
            diagnosticsService.checkFfmpeg(),
            diagnosticsService.checkDirectory('download_dir', 'Download directory', IplayarrParameter.DOWNLOAD_DIR),
            diagnosticsService.checkDirectory('complete_dir', 'Complete directory', IplayarrParameter.COMPLETE_DIR),
            diagnosticsService.checkBbc(),
        ]);

        const checks = [
            database,
            bbc,
            getIplayer,
            ytdlp,
            ffmpeg,
            download,
            complete,
            diagnosticsService.checkQueue(),
            ...diagnosticsService.checkActivity(),
        ];
        const worst = checks.reduce<CheckStatus>(
            (acc, { status }) => (severity[status] > severity[acc] ? status : acc),
            'ok'
        );

        return {
            status: worst as DiagnosticsReport['status'],
            generatedAt: Date.now(),
            version,
            uptime: await StatisticsService.getUptime(),
            checks,
        };
    },
};

export default diagnosticsService;
