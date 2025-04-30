import { AxiosResponse } from 'axios'

import { App } from '../../types/App';

export default interface AbstractNZBService {
    testConnection(inputUrl: string, credentials: { username?: string, password?: string, apikey?: string }): Promise<string | boolean>;
    addFile(app: App, files: Express.Multer.File[]): Promise<AxiosResponse>
}