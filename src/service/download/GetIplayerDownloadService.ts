import { ChildProcess, spawn } from 'child_process';

import AbstractDownloadService from '../../service/download/AbstractDownloadService';
import getIplayerExecutableService from '../getIplayerExecutableService';

class GetIplayerDownloadService implements AbstractDownloadService {
    async postProcess(): Promise<void> {
        return;
    }
    async download(pid: string, directory: string): Promise<ChildProcess> {
        const { exec, args } = await getIplayerExecutableService.getAllDownloadParameters(pid, directory);
        return spawn(exec, args);
    }
}

export default new GetIplayerDownloadService();
