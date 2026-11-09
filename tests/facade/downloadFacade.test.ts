import fs from 'fs';

import { timestampFile } from '../../server/constants/iPlayarrConstants';
import downloadFacade from '../../server/facade/downloadFacade';
import configService from '../../server/service/configService';
import GetIplayerDownloadService from '../../server/service/download/GetIplayerDownloadService';
import historyService from '../../server/service/historyService';
import metricsService from '../../server/service/metricsService';
import queueService from '../../server/service/queueService';
import { DownloadClient } from '../../server/types/enums/DownloadClient';

// Mocks
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$10$mockedhash'),
    compare: jest.fn().mockResolvedValue(false),
}));

jest.mock('fs', () => ({
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    readdirSync: jest.fn(),
    copyFileSync: jest.fn(),
    rmSync: jest.fn(),
    rm: jest.fn(),
    stat: jest.fn(),
    statSync: jest.fn(),
    readdir: jest.fn(),
}));

jest.mock('child_process', () => ({
    spawn: jest.fn(),
}));

jest.mock('../../server/service/configService', () => ({
    getParameter: jest.fn(),
}));

jest.mock('../../server/service/download/GetIplayerDownloadService', () => ({
    download: jest.fn(),
    postProcess: jest.fn(),
}));

jest.mock('../../server/service/download/YTDLPDownloadService', () => ({
    download: jest.fn(),
    postProcess: jest.fn(),
}));

jest.mock('../../server/service/queueService', () => ({
    updateQueue: jest.fn(),
    getFromQueue: jest.fn(),
    removeFromQueue: jest.fn(),
}));

jest.mock('../../server/service/loggingService', () => ({
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
}));

jest.mock('../../server/service/socketService', () => ({
    emit: jest.fn(),
}));

jest.mock('../../server/service/historyService', () => ({
    addHistory: jest.fn(),
}));

describe('DownloadFacade', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('download', () => {
        it('should correctly create directory, select service and handle process events', async () => {
            const pid = 'test-pid';
            const downloadDir = '/downloads';
            const pidDir = '/downloads/test-pid';

            // Mocks
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce(downloadDir) // For DOWNLOAD_DIR
                .mockResolvedValueOnce(DownloadClient.GET_IPLAYER); // For DOWNLOAD_CLIENT

            const mockChildProcess = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn(),
            };

            (GetIplayerDownloadService.download as jest.Mock).mockResolvedValue(mockChildProcess);

            // Act
            const result = await downloadFacade.download(pid);

            // Asserts
            expect(configService.getParameter).toHaveBeenCalledWith('DOWNLOAD_DIR');
            expect(fs.mkdirSync).toHaveBeenCalledWith(pidDir, { recursive: true });
            expect(fs.writeFileSync).toHaveBeenCalledWith(`${pidDir}/${timestampFile}`, '');

            expect(configService.getParameter).toHaveBeenCalledWith('DOWNLOAD_CLIENT');
            expect(GetIplayerDownloadService.download).toHaveBeenCalledWith(pid, pidDir);

            expect(mockChildProcess.stderr.on).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockChildProcess.stdout.on).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockChildProcess.on).toHaveBeenCalledWith('close', expect.any(Function));

            expect(result).toBe(mockChildProcess);
        });
    });

    describe('processComplete video file selection (via close handler)', () => {
        const pid = 'test-pid';
        const queueItem = { nzbName: 'Test.Episode', details: { size: 100 } };

        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
            (queueService.getFromQueue as jest.Mock).mockReset();
        });

        async function triggerClose(code: number | null): Promise<void> {
            const downloadDir = '/downloads';

            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce(downloadDir) // DOWNLOAD_DIR
                .mockResolvedValueOnce(DownloadClient.GET_IPLAYER); // DOWNLOAD_CLIENT

            const mockChildProcess = {
                stdout: { on: jest.fn() },
                stderr: { on: jest.fn() },
                on: jest.fn(),
            };
            (GetIplayerDownloadService.download as jest.Mock).mockResolvedValue(mockChildProcess);
            (GetIplayerDownloadService.postProcess as jest.Mock).mockResolvedValue(undefined);

            await downloadFacade.download(pid);

            const closeHandler = mockChildProcess.on.mock.calls.find(([event]) => event === 'close')?.[1];

            (queueService.getFromQueue as jest.Mock).mockReturnValueOnce(queueItem);
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('/complete') // COMPLETE_DIR
                .mockResolvedValueOnce('mp4'); // OUTPUT_FORMAT

            const closePromise = closeHandler(code);
            await jest.advanceTimersByTimeAsync(10000);
            await closePromise;
        }

        it('prefers a processed (non-_original) file when both exist', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['episode_original.mp4', 'episode.mp4']);

            await triggerClose(0);

            expect(fs.copyFileSync).toHaveBeenCalledWith(
                expect.stringContaining('/episode.mp4'),
                expect.any(String)
            );
        });

        it('falls back to the _original file once its size is stable', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['episode_original.mp4']);
            (fs.statSync as jest.Mock).mockReturnValue({ size: 12345 });

            await triggerClose(0);

            expect(fs.copyFileSync).toHaveBeenCalledWith(
                expect.stringContaining('episode_original.mp4'),
                expect.any(String)
            );
            expect(historyService.addHistory).toHaveBeenCalledWith(queueItem);
        });

        describe('metrics', () => {
            const downloads = () => metricsService.collect().find(({ name }) => name == 'iplayarr_downloads_total')?.samples;

            beforeEach(() => metricsService.reset());

            it('records a completed download', async () => {
                (fs.readdirSync as jest.Mock).mockReturnValue(['episode.mp4']);

                await triggerClose(0);

                expect(downloads()).toEqual([{ labels: { outcome: 'completed' }, value: 1 }]);
            });

            it('records a download whose post-processing throws as failed', async () => {
                (fs.readdirSync as jest.Mock).mockImplementation(() => {
                    throw new Error('disk gone');
                });

                await triggerClose(0);

                expect(downloads()).toEqual([{ labels: { outcome: 'failed' }, value: 1 }]);
                expect(metricsService.getLastEvents().download).toMatchObject({ ok: false, error: 'disk gone' });
            });

            it('records a non-zero exit as failed', async () => {
                await triggerClose(1);

                expect(downloads()).toEqual([{ labels: { outcome: 'failed' }, value: 1 }]);
                expect(metricsService.getLastEvents().download?.error).toBe('Exited with code 1');
            });

            it('records a signal exit as cancelled without marking downloads unhealthy', async () => {
                await triggerClose(null);

                expect(downloads()).toEqual([{ labels: { outcome: 'cancelled' }, value: 1 }]);
                expect(metricsService.getLastEvents().download).toBeUndefined();
            });
        });
    });

    describe('cleanupFailedDownloads', () => {
        it('should delete old download directories', async () => {
            const downloadDir = '/downloads';
            const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;

            const mockDirEntry = {
                name: 'oldDir',
                isDirectory: () => true,
            };

            (configService.getParameter as jest.Mock).mockResolvedValue(downloadDir);
            (fs.readdir as unknown as jest.Mock).mockImplementation((_path, opts, cb) => cb(null, [mockDirEntry]));
            (fs.stat as unknown as jest.Mock).mockImplementation((_path, cb) =>
                cb(null, { mtimeMs: threeHoursAgo - 10000 })
            );
            (fs.rm as unknown as jest.Mock).mockImplementation((_path, opts, cb) => cb(null));

            await downloadFacade.cleanupFailedDownloads();

            expect(fs.rm).toHaveBeenCalledWith(
                expect.stringContaining('oldDir'),
                { recursive: true, force: true },
                expect.any(Function)
            );
        });

        it('should not delete recent directories', async () => {
            const downloadDir = '/downloads';
            const now = Date.now();

            const mockDirEntry = {
                name: 'recentDir',
                isDirectory: () => true,
            };

            (configService.getParameter as jest.Mock).mockResolvedValue(downloadDir);
            (fs.readdir as unknown as jest.Mock).mockImplementation((_path, opts, cb) => cb(null, [mockDirEntry]));
            (fs.stat as unknown as jest.Mock).mockImplementation((_path, cb) => cb(null, { mtimeMs: now }));

            await downloadFacade.cleanupFailedDownloads();

            expect(fs.rm).not.toHaveBeenCalled();
        });
    });
});
