import { ChildProcess, spawn } from 'child_process';
import AbstractDownloadService from 'src/service/download/AbstractDownloadService';
import { IplayarrParameter } from 'src/types/IplayarrParameters';

import configService from '../configService';
import loggingService from '../loggingService';

class YTDLPDownloadService implements AbstractDownloadService {

    async download(pid: string, directory: string): Promise<ChildProcess> {
        const ytdlpExec = await configService.getParameter(IplayarrParameter.YTDLP_EXEC) as string;

        const iplayerURL: string = `https://www.bbc.co.uk/iplayer/episode/${pid}`;
        const outputTemplate = `${directory}/%(title)s.%(ext)s`;

        const args = [
            '--progress-template',
            '%(progress._percent_str)s of ~%(progress._total_bytes_str)s @ %(progress._speed_str)s ETA: %(progress.eta_str)s [audio+video]',
            '-o',
            outputTemplate,
            iplayerURL
        ];

        // Log the command being run
        const fullCommand = `${ytdlpExec} ${args.join(' ')}`;
        loggingService.debug(pid, `Running command: ${fullCommand}`);

        return spawn(ytdlpExec, args);
    }
}

export default new YTDLPDownloadService();