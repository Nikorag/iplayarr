import { AxiosResponse } from 'axios'

import { App } from '../../types/App';
import { UploadedFile } from '../../types/UploadedFile';

export default interface AbstractNZBService {
    testConnection(inputUrl: string, credentials: { username?: string, password?: string, apikey?: string }): Promise<string | boolean>;
    addFile(app: App, files: UploadedFile[]): Promise<AxiosResponse>
}