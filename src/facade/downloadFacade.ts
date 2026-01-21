import { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

import { progressRegex, timestampFile } from '../constants/iPlayarrConstants';
import configService from '../service/configService';
import AbstractDownloadService from '../service/download/AbstractDownloadService';
import GetIplayerDownloadService from '../service/download/GetIplayerDownloadService';
import YTDLPDownloadService from '../service/download/YTDLPDownloadService';
import historyService from '../service/historyService';
import loggingService from '../service/loggingService';
import queueService from '../service/queueService';
import socketService from '../service/socketService';
import { DownloadDetails } from '../types/DownloadDetails';
import { DownloadClient } from '../types/enums/DownloadClient';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { LogLine, LogLineLevel } from '../types/LogLine';
import { QueueEntry } from '../types/QueueEntry';
import { convertToMB, copyWithFallback, getETA } from '../utils/Utils';

class DownloadFacade {
    async download(pid: string): Promise<ChildProcess> {
        const pidDir: string = await this.#createPidDirectory(pid);
        const service: AbstractDownloadService = await this.#getService();
        const process: ChildProcess = await service.download(pid, pidDir);

        process.stderr?.on('data', this.#processError);
        process.stdout?.on('data', (data) => this.#processOutput(pid, data));
        process.on('close', (code) => this.#processComplete(pid, pidDir, code, service));

        return process;
    }

    #processError(data: any): void {
        loggingService.error(data);
    }

    #processOutput(pid: string, data: any): void {
        console.log(data.toString());
        const logLine: LogLine = { level: LogLineLevel.INFO, id: pid, message: data.toString(), timestamp: new Date() };
        socketService.emit('log', logLine);
        const downloadDetails: DownloadDetails | undefined = this.#parseProgress(pid, data);
        if (downloadDetails) {
            queueService.updateQueue(pid, downloadDetails);
        }
    }

    async #processComplete(pid: string, directory: string, code: any, service : AbstractDownloadService): Promise<void> {
        const completeDir = (await configService.getParameter(IplayarrParameter.COMPLETE_DIR)) as string;

        const outputFormat = await configService.getParameter(IplayarrParameter.OUTPUT_FORMAT);

        if (code === 0) {
            const queueItem: QueueEntry | undefined = queueService.getFromQueue(pid);
            if (queueItem) {
                try {
                    loggingService.debug(pid, `Looking for video files in ${directory}`);
                    const files = fs.readdirSync(directory);
                    const videoFile = files.find((file) => file.endsWith('.mp4') || file.endsWith('.mkv'));

                    if (videoFile) {
                        const oldPath = path.join(directory, videoFile);
                        loggingService.debug(pid, `Found video file ${oldPath}`);
                        const newPath = path.join(completeDir, `${queueItem?.nzbName}.${outputFormat}`);
                        loggingService.debug(pid, `Moving ${oldPath} to ${newPath}`);

                        copyWithFallback(oldPath, newPath);
                    }

                    // Delete the uuid directory and file after moving it
                    loggingService.debug(pid, `Deleting old directory ${directory}`);
                    fs.rmSync(directory, { recursive: true, force: true });

                    await historyService.addHistory(queueItem);
                } catch (err) {
                    loggingService.error(err);
                }
            }
        }
        queueService.removeFromQueue(pid);
        service.postProcess(pid, directory, code);
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
        const pidDir = `${downloadDir}/${pid}`;
        fs.mkdirSync(pidDir, { recursive: true });
        fs.writeFileSync(`${pidDir}/${timestampFile}`, '');
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
        fs.readdir(downloadDir, { withFileTypes: true }, (err, entries) => {
            if (err) {
                console.error('Error reading directory:', err);
                return;
            }

            entries.forEach((entry) => {
                if (!entry.isDirectory()) return;

                const dirPath: string = path.join(downloadDir, entry.name);
                const filePath: string = path.join(dirPath, timestampFile);

                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        // Ignore missing files
                        if (err.code !== 'ENOENT') console.error(`Error checking ${filePath}:`, err);
                        return;
                    }

                    if (stats.mtimeMs < threeHoursAgo) {
                        fs.rm(dirPath, { recursive: true, force: true }, (err) => {
                            if (err) {
                                loggingService.error(`Error deleting ${dirPath}:`, err);
                            } else {
                                loggingService.log(`Deleted old directory: ${dirPath}`);
                            }
                        });
                    }
                });
            });
        });
    }
}

export default new DownloadFacade();
