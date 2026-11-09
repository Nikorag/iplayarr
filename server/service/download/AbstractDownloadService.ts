import { ChildProcess } from 'child_process';

export default interface AbstractDownloadService {
    download(pid: string, directory: string): Promise<ChildProcess>;
    postProcess(pid: string, directory: string, code : any): Promise<void>;
}
