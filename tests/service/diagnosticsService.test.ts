import axios from 'axios';
import { execFile } from 'child_process';
import fs from 'fs/promises';

import { getDatabase } from '../../server/db/database';
import configService from '../../server/service/configService';
import diagnosticsService, { latestReleaseCache } from '../../server/service/diagnosticsService';
import getIplayerExecutableService from '../../server/service/getIplayerExecutableService';
import metricsService from '../../server/service/metricsService';
import queueService from '../../server/service/queueService';
import { IplayarrParameter } from '../../server/types/IplayarrParameters';

jest.mock('axios');
jest.mock('child_process');
jest.mock('../../server/db/database');
jest.mock('../../server/service/configService');
jest.mock('../../server/service/getIplayerExecutableService');
jest.mock('../../server/service/queueService');

const GIB = 1024 ** 3;

/** Makes execFile call back with the given outcome. */
const mockExec = (outcome: { stdout?: string; stderr?: string; error?: any }) =>
    (execFile as unknown as jest.Mock).mockImplementation((_e, _a, _o, cb) =>
        cb(outcome.error ?? null, outcome.stdout ?? '', outcome.stderr ?? '')
    );

const mockConfig = (values: Record<string, string>) =>
    (configService.getParameter as jest.Mock).mockImplementation(async (p: string) => values[p]);

describe('diagnosticsService', () => {
    beforeEach(async () => {
        jest.resetAllMocks();
        metricsService.reset();
        await latestReleaseCache.clear();
        (getIplayerExecutableService.getIPlayerExec as jest.Mock).mockResolvedValue({ exec: 'get_iplayer', args: [] });
    });

    describe('checkDatabase', () => {
        it('is ok when the database answers a ping', async () => {
            (getDatabase as jest.Mock).mockResolvedValue({ ping: jest.fn().mockResolvedValue(undefined) });

            expect((await diagnosticsService.checkDatabase()).status).toBe('ok');
        });

        it('is an error when the ping fails', async () => {
            (getDatabase as jest.Mock).mockResolvedValue({ ping: jest.fn().mockRejectedValue(new Error('down')) });

            const result = await diagnosticsService.checkDatabase();

            expect(result.status).toBe('error');
            expect(result.message).toContain('down');
        });
    });

    describe('checkGetIplayer', () => {
        beforeEach(() => {
            (axios.get as jest.Mock).mockResolvedValue({ data: { tag_name: 'v3.36' } });
        });

        it('reports an up to date version', async () => {
            mockExec({ stderr: 'get_iplayer v3.36, Copyright (C) 2008' });

            const result = await diagnosticsService.checkGetIplayer();

            expect(result.status).toBe('ok');
            expect(result.message).toContain('v3.36');
        });

        it('warns when a newer release exists', async () => {
            mockExec({ stderr: 'get_iplayer v3.35, Copyright (C) 2008' });

            const result = await diagnosticsService.checkGetIplayer();

            expect(result.status).toBe('warn');
            expect(result.message).toContain('v3.36 is available');
        });

        it('still passes when the latest release cannot be fetched', async () => {
            mockExec({ stderr: 'get_iplayer v3.10' });
            (axios.get as jest.Mock).mockRejectedValue(new Error('offline'));

            const result = await diagnosticsService.checkGetIplayer();

            expect(result.status).toBe('ok');
        });

        it('is an error when the binary cannot be started', async () => {
            mockExec({ error: Object.assign(new Error('nope'), { code: 'ENOENT' }) });

            expect((await diagnosticsService.checkGetIplayer()).status).toBe('error');
        });

        it('is an error when the shell cannot find the command', async () => {
            mockExec({ error: Object.assign(new Error('not found'), { code: 127 }) });

            const result = await diagnosticsService.checkGetIplayer();

            expect(result.status).toBe('error');
            expect(result.message).toContain('command not found');
        });

        it('tolerates a non-zero exit from --help', async () => {
            mockExec({ error: Object.assign(new Error('exit 1'), { code: 1 }), stderr: 'get_iplayer v3.36' });

            expect((await diagnosticsService.checkGetIplayer()).status).toBe('ok');
        });
    });

    describe('optional tools', () => {
        it('skips yt-dlp unless it is the download client', async () => {
            mockConfig({ DOWNLOAD_CLIENT: 'GET_IPLAYER' });

            expect((await diagnosticsService.checkYtdlp()).status).toBe('skipped');
        });

        it('checks yt-dlp when selected', async () => {
            mockConfig({ DOWNLOAD_CLIENT: 'YTDLP', YTDLP_EXEC: '/ytdlp/yt-dlp' });
            mockExec({ stdout: '2025.01.01\n' });

            const result = await diagnosticsService.checkYtdlp();

            expect(result).toMatchObject({ status: 'ok', message: 'v2025.01.01' });
            expect(execFile).toHaveBeenCalledWith('/ytdlp/yt-dlp', ['--version'], expect.anything(), expect.anything());
        });

        it('skips ffmpeg unless output is mkv', async () => {
            mockConfig({ OUTPUT_FORMAT: 'mp4' });

            expect((await diagnosticsService.checkFfmpeg()).status).toBe('skipped');
        });

        it('errors when mkv output is selected and ffmpeg is missing', async () => {
            mockConfig({ OUTPUT_FORMAT: 'mkv' });
            mockExec({ error: Object.assign(new Error('nope'), { code: 'ENOENT' }) });

            expect((await diagnosticsService.checkFfmpeg()).status).toBe('error');
        });
    });

    describe('checkDirectory', () => {
        const dirCheck = () =>
            diagnosticsService.checkDirectory('download_dir', 'Download directory', IplayarrParameter.DOWNLOAD_DIR);

        it('errors when not configured', async () => {
            mockConfig({});

            expect((await dirCheck()).status).toBe('error');
        });

        it('errors when not writable', async () => {
            mockConfig({ DOWNLOAD_DIR: '/nope' });
            jest.spyOn(fs, 'access').mockRejectedValue(Object.assign(new Error('x'), { code: 'EACCES' }));

            const result = await dirCheck();

            expect(result.status).toBe('error');
            expect(result.message).toContain('EACCES');
        });

        it.each([
            [50 * GIB, 'ok'],
            [3 * GIB, 'warn'],
            [0.5 * GIB, 'error'],
        ])('grades %d free bytes as %s', async (free, status) => {
            mockConfig({ DOWNLOAD_DIR: '/downloads' });
            jest.spyOn(fs, 'access').mockResolvedValue(undefined);
            jest.spyOn(fs, 'statfs').mockResolvedValue({ bavail: free, bsize: 1 } as any);

            expect((await dirCheck()).status).toBe(status);
        });

        it('is still ok when free space cannot be read', async () => {
            mockConfig({ DOWNLOAD_DIR: '/downloads' });
            jest.spyOn(fs, 'access').mockResolvedValue(undefined);
            jest.spyOn(fs, 'statfs').mockRejectedValue(new Error('unsupported'));

            expect((await dirCheck()).status).toBe('ok');
        });
    });

    describe('checkBbc', () => {
        it('is ok when reachable', async () => {
            (axios.get as jest.Mock).mockResolvedValue({ status: 200 });

            expect((await diagnosticsService.checkBbc()).status).toBe('ok');
        });

        it('is an error when unreachable', async () => {
            (axios.get as jest.Mock).mockRejectedValue(Object.assign(new Error('x'), { code: 'ENOTFOUND' }));

            const result = await diagnosticsService.checkBbc();

            expect(result.status).toBe('error');
            expect(result.message).toContain('ENOTFOUND');
        });
    });

    describe('checkActivity', () => {
        it('skips activity that has not happened yet', () => {
            expect(diagnosticsService.checkActivity().every(({ status }) => status == 'skipped')).toBe(true);
        });

        it('warns with the reason when the last attempt failed', () => {
            metricsService.recordSearch('get_iplayer', 10, new Error('exit 2'));
            metricsService.recordDownload('completed');

            const [search, download] = diagnosticsService.checkActivity();

            expect(search.status).toBe('warn');
            expect(search.message).toContain('exit 2');
            expect(download.status).toBe('ok');
        });
    });

    describe('getReport', () => {
        it('reports the worst status of all checks', async () => {
            mockConfig({ DOWNLOAD_CLIENT: 'GET_IPLAYER', OUTPUT_FORMAT: 'mp4', DOWNLOAD_DIR: '/d', COMPLETE_DIR: '/c' });
            (getDatabase as jest.Mock).mockResolvedValue({ ping: jest.fn().mockResolvedValue(undefined) });
            (queueService.getQueue as jest.Mock).mockReturnValue([]);
            (axios.get as jest.Mock).mockRejectedValue(new Error('offline'));
            mockExec({ stderr: 'get_iplayer v3.36' });
            jest.spyOn(fs, 'access').mockResolvedValue(undefined);
            jest.spyOn(fs, 'statfs').mockResolvedValue({ bavail: 50 * GIB, bsize: 1 } as any);

            const report = await diagnosticsService.getReport();

            expect(report.checks.find(({ id }) => id == 'bbc')?.status).toBe('error');
            expect(report.status).toBe('error');
            expect(report.checks.map(({ id }) => id)).toEqual(
                expect.arrayContaining(['database', 'get_iplayer', 'download_dir', 'complete_dir', 'queue', 'search'])
            );
        });
    });
});
