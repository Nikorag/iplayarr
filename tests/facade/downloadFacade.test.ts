import fs from 'fs/promises';

import { timestampFile } from '../../server/constants/iPlayarrConstants';
import downloadFacade, { knownProblemHint } from '../../server/facade/downloadFacade';
import configService from '../../server/service/configService';
import GetIplayerDownloadService from '../../server/service/download/GetIplayerDownloadService';
import historyService from '../../server/service/historyService';
import loggingService from '../../server/service/loggingService';
import metricsService from '../../server/service/metricsService';
import queueService from '../../server/service/queueService';
import { DownloadClient } from '../../server/types/enums/DownloadClient';

// Mocks
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$10$mockedhash'),
    compare: jest.fn().mockResolvedValue(false),
}));

jest.mock('fs/promises', () => ({
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    copyFile: jest.fn(),
    rm: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
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
    addFailure: jest.fn(),
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
            expect(fs.mkdir).toHaveBeenCalledWith(pidDir, { recursive: true });
            expect(fs.writeFile).toHaveBeenCalledWith(`${pidDir}/${timestampFile}`, '');

            expect(configService.getParameter).toHaveBeenCalledWith('DOWNLOAD_CLIENT');
            expect(GetIplayerDownloadService.download).toHaveBeenCalledWith(pid, pidDir);

            expect(mockChildProcess.stderr.on).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockChildProcess.stdout.on).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockChildProcess.on).toHaveBeenCalledWith('close', expect.any(Function));

            expect(result).toBe(mockChildProcess);
        });
    });

    describe('subprocess output', () => {
        // The facade remembers which downloads it has already explained, so give each test its own
        let pid = '';
        let counter = 0;
        beforeEach(() => {
            pid = `output-pid-${counter++}`;
        });

        const startDownload = async () => {
            (configService.getParameter as jest.Mock)
                .mockResolvedValueOnce('/downloads')
                .mockResolvedValueOnce(DownloadClient.GET_IPLAYER);
            const stderrOn = jest.fn();
            const stdoutOn = jest.fn();
            (GetIplayerDownloadService.download as jest.Mock).mockResolvedValue({
                stdout: { on: stdoutOn },
                stderr: { on: stderrOn },
                on: jest.fn(),
            });
            await downloadFacade.download(pid);
            const handler = (on: jest.Mock) => on.mock.calls.find(([event]) => event === 'data')?.[1];
            return { stderr: handler(stderrOn), stdout: handler(stdoutOn) };
        };

        it('logs stderr as text against the download, not as a raw Buffer', async () => {
            const { stderr } = await startDownload();

            stderr(Buffer.from('WARNING: Something went wrong\n'));

            expect(loggingService.error).toHaveBeenCalledWith(pid, 'WARNING: Something went wrong');
        });

        it('ignores empty stderr output', async () => {
            const { stderr } = await startDownload();

            stderr(Buffer.from('  \n'));

            expect(loggingService.error).not.toHaveBeenCalled();
        });

        it('explains a geolocation failure once per download, however often it repeats', async () => {
            const { stderr } = await startDownload();

            stderr(Buffer.from('ERROR: [bbc.co.uk] m002q8ks: bbc.co.uk returned error: geolocation'));
            stderr(Buffer.from('ERROR: [bbc.co.uk] m002q8ks: bbc.co.uk returned error: geolocation'));

            expect(loggingService.log).toHaveBeenCalledTimes(1);
            expect(loggingService.log).toHaveBeenCalledWith(pid, expect.stringContaining('UK IP address'));
        });

        it('also recognises problems reported on stdout', async () => {
            const { stdout } = await startDownload();

            stdout(Buffer.from('WARNING: Response: 410 Gone\n'));

            expect(loggingService.log).toHaveBeenCalledWith(pid, expect.stringContaining('410 Gone'));
        });
    });

    describe('knownProblemHint', () => {
        it.each([
            ['ERROR: bbc.co.uk returned error: geolocation', /UK IP address/],
            ['This video is not available in your country', /UK IP address/],
            ['WARNING: Response: 410 Gone', /410 Gone/],
            ['410: Gone', /410 Gone/],
        ])('explains %p', (text, expected) => {
            expect(knownProblemHint(text)).toMatch(expected);
        });

        it.each([['INFO: Downloaded: 444.74 MB'], ['WARNING: Response: 429 Too Many Requests']])(
            'has nothing to say about %p',
            (text) => {
                expect(knownProblemHint(text)).toBeUndefined();
            }
        );
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

        async function triggerClose(code: number | null, advanceMs: number = 10000): Promise<void> {
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
            await jest.advanceTimersByTimeAsync(advanceMs);
            await closePromise;
        }

        it('prefers a processed (non-_original) file when both exist', async () => {
            (fs.readdir as unknown as jest.Mock).mockResolvedValue(['episode_original.mp4', 'episode.mp4']);

            await triggerClose(0);

            expect(fs.copyFile).toHaveBeenCalledWith(
                expect.stringContaining('/episode.mp4'),
                expect.any(String)
            );
        });

        it('falls back to the _original file once its size is stable', async () => {
            (fs.readdir as unknown as jest.Mock).mockResolvedValue(['episode_original.mp4']);
            (fs.stat as unknown as jest.Mock).mockResolvedValue({ size: 12345 });

            await triggerClose(0);

            expect(fs.copyFile).toHaveBeenCalledWith(
                expect.stringContaining('episode_original.mp4'),
                expect.any(String)
            );
            expect(historyService.addHistory).toHaveBeenCalledWith(queueItem);
        });

        it('rescans for the processed file when the _original file vanishes before it can be copied', async () => {
            // Poll 1 and 2: only the _original file exists with a stable size (tagging still running)
            // Poll 3: tagging has finished and replaced it with the processed file
            (fs.readdir as unknown as jest.Mock)
                .mockResolvedValueOnce(['episode_original.mp4'])
                .mockResolvedValueOnce(['episode_original.mp4'])
                .mockResolvedValue(['episode.mp4']);
            (fs.stat as unknown as jest.Mock).mockResolvedValue({ size: 12345 });
            (fs.copyFile as jest.Mock).mockRejectedValueOnce(
                Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })
            );

            await triggerClose(0);

            expect(fs.copyFile).toHaveBeenCalledTimes(2);
            expect(fs.copyFile).toHaveBeenLastCalledWith(
                expect.stringContaining('/episode.mp4'),
                expect.any(String)
            );
            expect(historyService.addHistory).toHaveBeenCalledWith(queueItem);
            expect(loggingService.error).not.toHaveBeenCalled();
        });

        it('records a failure, not a completion, when get_iplayer exits 0 without producing a video file', async () => {
            (fs.readdir as unknown as jest.Mock).mockResolvedValue([]);

            // The facade polls for up to ~5 minutes before giving up
            await triggerClose(0, 310000);

            expect(historyService.addHistory).not.toHaveBeenCalled();
            expect(historyService.addFailure).toHaveBeenCalledWith(
                queueItem,
                expect.stringContaining('no video file was produced')
            );
            expect(metricsService.getLastEvents().download).toMatchObject({ ok: false });
        });

        describe('metrics', () => {
            const downloads = () => metricsService.collect().find(({ name }) => name == 'iplayarr_downloads_total')?.samples;

            beforeEach(() => metricsService.reset());

            it('records a completed download', async () => {
                (fs.readdir as unknown as jest.Mock).mockResolvedValue(['episode.mp4']);

                await triggerClose(0);

                expect(downloads()).toEqual([{ labels: { outcome: 'completed' }, value: 1 }]);
            });

            it('records a download whose post-processing throws as failed', async () => {
                (fs.readdir as unknown as jest.Mock).mockRejectedValue(new Error('disk gone'));

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
            (fs.readdir as unknown as jest.Mock).mockResolvedValue([mockDirEntry]);
            (fs.stat as unknown as jest.Mock).mockResolvedValue({ mtimeMs: threeHoursAgo - 10000 });
            (fs.rm as unknown as jest.Mock).mockResolvedValue(undefined);

            await downloadFacade.cleanupFailedDownloads();

            expect(fs.rm).toHaveBeenCalledWith(
                expect.stringContaining('oldDir'),
                { recursive: true, force: true }
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
            (fs.readdir as unknown as jest.Mock).mockResolvedValue([mockDirEntry]);
            (fs.stat as unknown as jest.Mock).mockResolvedValue({ mtimeMs: now });

            await downloadFacade.cleanupFailedDownloads();

            expect(fs.rm).not.toHaveBeenCalled();
        });
    });
});
