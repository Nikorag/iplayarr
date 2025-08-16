import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';

import AbstractDownloadService from '../../service/download/AbstractDownloadService';
import { SpawnExecutable } from '../../types/GetIplayer/SpawnExecutable';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import { qualityProfiles } from '../../types/QualityProfiles';
import configService from '../configService';
import loggingService from '../loggingService';

class YTDLPDownloadService implements AbstractDownloadService {
    async postProcess(pid: string, directory: string, code : any): Promise<void> {
        if (code != 0) {
            fs.rmSync(directory, { recursive: true, force: true });
        }
    }

    async #getExecutable(): Promise<SpawnExecutable> {
        const ytdlpExecConf = (await configService.getParameter(IplayarrParameter.YTDLP_EXEC)) as string;
        const execArgs = ytdlpExecConf.split(' ');
        const ytdlpExec: string = execArgs.shift() as string;

        return { exec: ytdlpExec, args: execArgs };
    }

    async download(pid: string, directory: string): Promise<ChildProcess> {
        const executable: SpawnExecutable = await this.#getExecutable();
        const videoQuality = (await configService.getParameter(IplayarrParameter.VIDEO_QUALITY)) as string;
        const width_str = qualityProfiles.find(({ id }) => id == videoQuality)?.quality;

        const outputFormat = await configService.getParameter(IplayarrParameter.OUTPUT_FORMAT) as string;

        if (width_str) {
            const width = parseInt(width_str);
            if (!isNaN(width)) {
                executable.args.push('-f');
                executable.args.push(`bestvideo[width<=${width}]+bestaudio`);
                executable.args.push('--merge-output-format');
                executable.args.push(outputFormat);
	    }
        }

        const iplayerURL: string = `https://www.bbc.co.uk/iplayer/episode/${pid}`;
        const outputTemplate = `${directory}/%(title)s.%(ext)s`;

        const args = [
            ...executable.args,
            '--progress-template',
            '%(progress._percent_str)s of ~%(progress._total_bytes_estimate_str)s @ %(progress._speed_str)s ETA: %(progress.eta_str)s [audio+video]',
            '-o',
            outputTemplate,
            iplayerURL,
        ];

        // Log the command being run
        const fullCommand = `${executable.exec} ${args.join(' ')}`;
        loggingService.debug(pid, `Running command: ${fullCommand}`);

        return spawn(executable.exec, args);
    }
}

export default new YTDLPDownloadService();
