import { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import configService from 'src/service/configService'
import AbstractDownloadService from 'src/service/download/AbstractDownloadService';
import GetIplayerDownloadService from 'src/service/download/GetIplayerDownloadService';
import YTDLPDownloadService from 'src/service/download/YTDLPDownloadService';
import historyService from 'src/service/historyService';
import loggingService from 'src/service/loggingService';
import queueService from 'src/service/queueService';
import socketService from 'src/service/socketService';
import { DownloadDetails } from 'src/types/DownloadDetails';
import { DownloadClient } from 'src/types/enums/DownloadClient'
import { IplayarrParameter } from 'src/types/IplayarrParameters'
import { LogLine, LogLineLevel } from 'src/types/LogLine';
import { QueueEntry } from 'src/types/QueueEntry';

import { progressRegex, timestampFile } from '../constants/iPlayarrConstants';

class DownloadFacade {
    async download(pid: string): Promise<ChildProcess> {
        const pidDir : string = await this.createPidDirectory(pid);
        const service : AbstractDownloadService = await this.getService();
        const process : ChildProcess = await service.download(pid, pidDir);

        process.stderr?.on('data', this.processError);
        process.stdout?.on('data', data => this.processOuput(pid, data));
        process.on('close', code => this.processComplete(pid, pidDir, code));

        return process;
    }

    processError(data : any) : void {
        // Log the Error
        loggingService.error(data);
    }

    processOuput(pid : string, data : any) : void {
        // Log the line
        console.log(data.toString());
        const logLine: LogLine = { level: LogLineLevel.INFO, id: pid, message: data.toString(), timestamp: new Date() }
        socketService.emit('log', logLine);
        const downloadDetails : DownloadDetails | undefined = this.parseProgress(pid, data);
        if (downloadDetails){
            queueService.updateQueue(pid, downloadDetails);
        }
    }

    async processComplete(pid : string, directory : string, code : any) : Promise<void> {
        const completeDir = await configService.getParameter(IplayarrParameter.COMPLETE_DIR) as string;
        
        if (code === 0) {
            const queueItem: QueueEntry | undefined = queueService.getFromQueue(pid);
            if (queueItem) {
                try {
                    loggingService.debug(pid, `Looking for MP4 files in ${directory}`);
                    const files = fs.readdirSync(directory);
                    const mp4File = files.find(file => file.endsWith('.mp4'));

                    if (mp4File) {
                        const oldPath = path.join(directory, mp4File);
                        loggingService.debug(pid, `Found MP4 file ${oldPath}`);
                        const newPath = path.join(completeDir, `${queueItem?.nzbName}.mp4`);
                        loggingService.debug(pid, `Moving ${oldPath} to ${newPath}`);

                        fs.copyFileSync(oldPath, newPath);
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
    }

    async getService() : Promise<AbstractDownloadService> {
        const client : DownloadClient = (await configService.getParameter(IplayarrParameter.DOWNLOAD_CLIENT)) as DownloadClient
        switch (client) {
	    case DownloadClient.YTDLP:
	        return YTDLPDownloadService;
        case DownloadClient.GET_IPLAYER:
	    default:
	        return GetIplayerDownloadService;
        }
    }

    async createPidDirectory(pid : string): Promise<string> {
        const downloadDir : string = await configService.getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;
        const pidDir = `${downloadDir}/${pid}`;
        fs.mkdirSync(pidDir, { recursive: true });
        fs.writeFileSync(`${pidDir}/${timestampFile}`, '');
        return pidDir;
    }

    parseProgress(pid: string, data: any): DownloadDetails | undefined {
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
                    size: parseFloat(size),
                    speed: parseFloat(speed),
                    eta,
                    sizeLeft
                }
    
                return deltaDetails;
            }
        }
        return;
    }
}

export default new DownloadFacade();
