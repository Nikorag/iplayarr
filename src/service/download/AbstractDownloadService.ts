import { ChildProcess } from 'child_process';

export default interface AbstractDownloadService {
    download(pid: string, directory : string) : Promise<ChildProcess>;
}