import { ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

import { progressRegex, timestampFile } from '../constants/iPlayarrConstants';
import configService from '../service/configService';
import AbstractDownloadService from '../service/download/AbstractDownloadService';
import GetIplayerDownloadService from '../service/download/GetIplayerDownloadService';
import YTDLPDownloadService from '../service/download/YTDLPDownloadService';
import historyService from '../service/historyService';
import loggingService from '../service/loggingService';
import metricsService from '../service/metricsService';
import queueService from '../service/queueService';
import socketService from '../service/socketService';
import { DownloadDetails } from '../types/DownloadDetails';
import { DownloadClient } from '../types/enums/DownloadClient';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { LogLine, LogLineLevel } from '../types/LogLine';
import { QueueEntry } from '../types/QueueEntry';
import { convertToMB, copyWithFallbackAsync, getETA } from '../utils/Utils';

const GEOLOCATION_HINT =
    'The BBC rejected this request because of where it came from. iPlayer only works from a UK IP address, ' +
    'so if iPlayarr runs behind a VPN check that it exits in the UK and that this container is the one routed through it.';

const GONE_HINT =
    'The BBC returned 410 Gone for this programme. That can mean it has been replaced with a revised version or ' +
    'is not available to your connection. Try again later, check the VPN/location, or switch the Download Client to yt-dlp in Settings.';

/** A short explanation for download output that matches a well known cause, if there is one. */
export const knownProblemHint = (text: string): string | undefined => {
    if (/geolocation|geo-?restrict|not available in your (country|region)/i.test(text)) {
        return GEOLOCATION_HINT;
    }
    if (/\b410[:\s]+gone\b/i.test(text)) {
        return GONE_HINT;
    }
    return undefined;
};

class DownloadFacade {
    async download(pid: string): Promise<ChildProcess> {
        const pidDir: string = await this.#createPidDirectory(pid);
        const service: AbstractDownloadService = await this.#getService();
        const process: ChildProcess = await service.download(pid, pidDir);

        process.on('error', (err) => {
            loggingService.error(pid, `Download process error: ${err.message}`);
            metricsService.recordDownload('failed', err.message);
            queueService.removeFromQueue(pid);
        });
        process.stderr?.on('data', (data) => this.#processError(pid, data));
        process.stdout?.on('data', (data) => this.#processOutput(pid, data));
        process.on('close', (code) => this.#processComplete(pid, pidDir, code, service));

        return process;
    }

    #processError(pid: string, data: any): void {
        const text = data.toString().trim();
        if (text) {
            loggingService.error(pid, text);
            this.#hintAtKnownProblems(pid, text);
        }
    }

    // Downloads that fail because of where iPlayarr is running look the same as any other failure in the logs,
    // so point at the usual cause once per download rather than once per retry.
    #hintAtKnownProblems(pid: string, text: string): void {
        if (this.#hinted.has(pid)) {
            return;
        }
        const hint = knownProblemHint(text);
        if (hint) {
            this.#hinted.add(pid);
            loggingService.log(pid, hint);
        }
    }

    #hinted = new Set<string>();

    #processOutput(pid: string, data: any): void {
        console.log(data.toString());
        this.#hintAtKnownProblems(pid, data.toString());
        const logLine: LogLine = { level: LogLineLevel.INFO, id: pid, message: data.toString(), timestamp: new Date() };
        socketService.emit('log', logLine);
        const downloadDetails: DownloadDetails | undefined = this.#parseProgress(pid, data);
        if (downloadDetails) {
            queueService.updateQueue(pid, downloadDetails);
        }
    }

    async #processComplete(pid: string, directory: string, code: any, service : AbstractDownloadService): Promise<void> {
        this.#hinted.delete(pid);
        const completeDir = (await configService.getParameter(IplayarrParameter.COMPLETE_DIR)) as string;

        const outputFormat = await configService.getParameter(IplayarrParameter.OUTPUT_FORMAT);

        if (code === 0) {
            const queueItem: QueueEntry | undefined = queueService.getFromQueue(pid);
            if (queueItem) {
                try {
                    // Run the download method postProcess
                    await service.postProcess(pid, directory, code);

                    //Move the resultant file
                    const isVideo = (file: string) => file.endsWith('.mp4') || file.endsWith('.mkv');
                    const isOriginal = (file: string) => file.endsWith('_original.mp4') || file.endsWith('_original.mkv');
                    // get-iplayer's own post-processing (converting to MPEG-TS/MP4, tagging)
                    // keeps running for real wall-clock time - tens of seconds for a large
                    // file - after this process's 'close' event fires. Poll instead of
                    // scanning once, and only accept the _original file once its size has
                    // been stable for a full interval (some downloads never produce a second,
                    // non-_original file at all).
                    let videoFile: string | undefined;
                    let lastOriginalSize = -1;
                    const maxAttempts = 100; // ~5 minutes at 3s apart
                    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                        const files = await fs.readdir(directory);
                        const processedFile = files.find((file) => isVideo(file) && !isOriginal(file));
                        const originalFile = files.find((file) => isVideo(file) && isOriginal(file));

                        let candidate: string | undefined;
                        if (processedFile) {
                            candidate = processedFile;
                        } else if (originalFile) {
                            const size = (await fs.stat(path.join(directory, originalFile))).size;
                            if (size === lastOriginalSize) {
                                candidate = originalFile;
                            }
                            lastOriginalSize = size;
                        } else {
                            lastOriginalSize = -1;
                        }

                        if (candidate) {
                            const oldPath = path.join(directory, candidate);
                            const newPath = path.join(completeDir, `${queueItem?.nzbName}.${outputFormat}`);
                            loggingService.debug(pid, `Found video file ${oldPath}, moving to ${newPath}`);

                            try {
                                await copyWithFallbackAsync(oldPath, newPath);
                                videoFile = candidate;
                                break;
                            } catch (copyErr: any) {
                                if (copyErr.code !== 'ENOENT') {
                                    throw copyErr;
                                }
                                // The file we picked disappeared. That means get-iplayer's post-processing
                                // (e.g. tagging) just finished and replaced it, so go back to polling and
                                // pick up the processed file rather than abandoning the download.
                                loggingService.debug(
                                    pid,
                                    `${oldPath} vanished before copy for '${queueItem.nzbName}', rescanning for the processed file`
                                );
                                lastOriginalSize = -1;
                            }
                        }

                        if (attempt < maxAttempts) {
                            await new Promise((resolve) => setTimeout(resolve, 3000));
                        }
                    }

                    // Delete the uuid directory and file after moving it
                    loggingService.debug(pid, `Deleting old directory ${directory}`);
                    await fs.rm(directory, { recursive: true, force: true });

                    if (videoFile) {
                        await historyService.addHistory(queueItem);
                        metricsService.recordDownload('completed');
                    } else {
                        // get-iplayer can exit 0 without producing a file. Report it as failed so Sonarr/Radarr
                        // don't try to import a file that doesn't exist.
                        const message = `get_iplayer exited successfully but no video file was produced for '${queueItem.nzbName}'`;
                        loggingService.error(pid, message);
                        await historyService.addFailure(queueItem, message);
                        metricsService.recordDownload('failed', message);
                    }
                } catch (err: any) {
                    loggingService.error(err);
                    metricsService.recordDownload('failed', err?.message ?? String(err));
                }
            }
        } else if (code === null) {
            // Killed by a signal, which is how a cancelled download ends
            metricsService.recordDownload('cancelled');
        } else {
            metricsService.recordDownload('failed', `Exited with code ${code}`);
        }
        queueService.removeFromQueue(pid);
    }

    async #getService(): Promise<AbstractDownloadService> {
        const client: DownloadClient = (await configService.getParameter(
            IplayarrParameter.DOWNLOAD_CLIENT
        )) as DownloadClient;
        switch (client) {
            case DownloadClient.YTDLP:
                return YTDLPDownloadService;
            case DownloadClient.GET_IPLAYER:
            default:
                return GetIplayerDownloadService;
        }
    }

    async #createPidDirectory(pid: string): Promise<string> {
        const downloadDir: string = (await configService.getParameter(IplayarrParameter.DOWNLOAD_DIR)) as string;
        if (!downloadDir) {
            throw new Error('DOWNLOAD_DIR is not set. Configure the download directory in Settings or via the DOWNLOAD_DIR environment variable.');
        }
        const pidDir = `${downloadDir}/${pid}`;
        await fs.mkdir(pidDir, { recursive: true });
        await fs.writeFile(`${pidDir}/${timestampFile}`, '');
        return pidDir;
    }

    #parseProgress(pid: string, data: any): DownloadDetails | undefined {
        const lines: string[] = data.toString().split('\n');
        const progressLines: string[] = lines.filter((l) => progressRegex.exec(l));
        if (progressLines.length > 0) {
            const progressLine: string = progressLines.pop() as string;
            const match = progressRegex.exec(progressLine);
            if (match) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [_, progress, size, speed, eta] = match;
                const percentFactor = (100 - parseFloat(progress)) / 100;

                const sizeLeft = size ? parseFloat(size) * percentFactor : undefined;
                const deltaDetails: Partial<DownloadDetails> = {
                    uuid: pid,
                    progress: parseFloat(progress),
                    size: convertToMB(size),
                    speed: convertToMB(speed),
                    eta: getETA(eta, convertToMB(size), convertToMB(speed), parseFloat(progress)),
                    sizeLeft,
                };

                return deltaDetails;
            }
        }
        return;
    }

    async cleanupFailedDownloads(): Promise<void> {
        const downloadDir = (await configService.getParameter(IplayarrParameter.DOWNLOAD_DIR)) as string;
        const threeHoursAgo: number = Date.now() - 3 * 60 * 60 * 1000;
        let entries;
        try {
            entries = await fs.readdir(downloadDir, { withFileTypes: true });
        } catch (err) {
            console.error('Error reading directory:', err);
            return;
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            if (queueService.getFromQueue(entry.name)) continue;

            const dirPath: string = path.join(downloadDir, entry.name);
            const filePath: string = path.join(dirPath, timestampFile);

            try {
                const stats = await fs.stat(filePath);
                if (stats.mtimeMs < threeHoursAgo) {
                    try {
                        await fs.rm(dirPath, { recursive: true, force: true });
                        loggingService.log(`Deleted old directory: ${dirPath}`);
                    } catch (err) {
                        loggingService.error(`Error deleting ${dirPath}:`, err);
                    }
                }
            } catch (err: any) {
                // Ignore missing files
                if (err.code !== 'ENOENT') console.error(`Error checking ${filePath}:`, err);
            }
        }
    }
}

export default new DownloadFacade();
