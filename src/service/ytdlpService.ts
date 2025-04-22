import { ChildProcess, spawn } from 'child_process';
import configService from 'src/service/configService'
import queueService from 'src/service/queueService'
import socketService from 'src/service/socketService'
import historyService from 'src/service/historyService'
import loggingService from 'src/service/loggingService'
import { IplayarrParameter } from 'src/types/IplayarrParameters'

import fs from 'fs'
import path from 'path'

import { QueueEntry } from '../types/QueueEntry';

import { progressRegex } from '../constants/iPlayarrConstants'
import { DownloadDetails } from '../types/DownloadDetails'
import { LogLine, LogLineLevel } from '../types/LogLine';

class YTDLPService {
    async download(pid: string, pidDir: string): Promise<ChildProcess> {
        const ytdlpExec = await configService.getParameter(IplayarrParameter.YTDLP_EXEC) as string;
	    
        const iplayerURL : string = `https://www.bbc.co.uk/iplayer/episode/${pid}`

        const downloadProcess = spawn(ytdlpExec, [
	    '--progress-template',
	    '"download":"%(progress._percent_str)s of ~%(progress.total_bytes_str)s @ %(progress._speed_str)s ETA: %(progress.eta)s [audio+video]"',
	    '-o',
	    `"${pidDir}/%(title)s.%(ext)s"`,
	    `"${iplayerURL}"`
        ]);

        downloadProcess.stdout.on('data', (data) => {
            if (queueService.getFromQueue(pid)) {
                this.logProgress(pid, data);
                const downloadDetails : DownloadDetails | undefined = this.parseProgress(pid, data);
                if (downloadDetails){
                    queueService.updateQueue(pid, downloadDetails);
                }
            }
        });

	downloadProcess.on('close', (code) => this.processCompletedDownload(pid, code));

        return downloadProcess;
    }

    logProgress(pid: string, data : any) {
        console.log(data.toString());
        const logLine: LogLine = { level: LogLineLevel.INFO, id: pid, message: data.toString(), timestamp: new Date() }
        socketService.emit('log', logLine);
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
                const sizeLeft = parseFloat(size) * percentFactor;

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

    async processCompletedDownload(pid: string, code: number | null): Promise<void> {
        const [downloadDir, completeDir] = await configService.getParameters(IplayarrParameter.DOWNLOAD_DIR, IplayarrParameter.COMPLETE_DIR) as string[];
        if (code === 0) {
            const queueItem: QueueEntry | undefined = queueService.getFromQueue(pid);
            if (queueItem) {
                try {
                    const uuidPath = path.join(downloadDir, pid);
                    loggingService.debug(pid, `Looking for MP4 files in ${uuidPath}`);
                    const files = fs.readdirSync(uuidPath);
                    const mp4File = files.find(file => file.endsWith('.mp4'));

                    if (mp4File) {
                        const oldPath = path.join(uuidPath, mp4File);
                        loggingService.debug(pid, `Found MP4 file ${oldPath}`);
                        const newPath = path.join(completeDir, `${queueItem?.nzbName}.mp4`);
                        loggingService.debug(pid, `Moving ${oldPath} to ${newPath}`);

                        fs.copyFileSync(oldPath, newPath);
                    }

                    // Delete the uuid directory and file after moving it
                    loggingService.debug(pid, `Deleting old directory ${uuidPath}`);
                    fs.rmSync(uuidPath, { recursive: true, force: true });

                    await historyService.addHistory(queueItem);
                } catch (err) {
                    loggingService.error(err);
                }
            }
        }
        queueService.removeFromQueue(pid);
    }
}

export default new YTDLPService();
