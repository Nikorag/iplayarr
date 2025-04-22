import { ChildProcess } from 'child_process';
import fs from 'fs';
import configService from 'src/service/configService'
import iplayerService from 'src/service/iplayerService'
import ytdlpService from 'src/service/ytdlpService'
import { DownloadClient } from 'src/types/enums/DownloadClient'
import { IplayarrParameter } from 'src/types/IplayarrParameters'

import { timestampFile } from '../constants/iPlayarrConstants';

class DownloadFacade {
    async download(pid: string): Promise<ChildProcess> {
        const pidDir = await this.createPidDirectory(pid);
        const service = await this.getService();
        return await service.download(pid, pidDir);
    }

    async getService() {
        const client : DownloadClient = (await configService.getParameter(IplayarrParameter.DOWNLOAD_CLIENT)) as DownloadClient
        switch (client) {
	    case DownloadClient.YTDLP:
	        return ytdlpService;
        case DownloadClient.GET_IPLAYER:
	    default:
	        return iplayerService;
        }
    }

    async createPidDirectory(pid : string): Promise<string> {
        const downloadDir : string = await configService.getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;
        const pidDir = `${downloadDir}/${pid}`;
        fs.mkdirSync(pidDir, { recursive: true });
        fs.writeFileSync(`${pidDir}/${timestampFile}`, '');
        return pidDir;
    }
}

export default new DownloadFacade();
