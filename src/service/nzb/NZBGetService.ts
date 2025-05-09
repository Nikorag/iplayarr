import axios, { AxiosResponse } from 'axios';
import { v4 } from 'uuid';

import { App } from '../../types/App';
import { NZBGetAppendRequest } from '../../types/requests/nzbget/NZBGetAppendRequest';
import AbstractNZBService from './AbstractNZBService';

class NZBGetService implements AbstractNZBService {

    async testConnection(inputUrl: string, { username, password }: any): Promise<string | boolean> {
        const url = new URL(`${inputUrl}/jsonrpc`);
        url.username = username;
        url.password = password;

        try {
            const response = await axios.get(`${url.toString()}/version`);
            if (response.status == 200) return true;
            return false;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return error.message;
            }
            return false;
        }
    }

    async addFile({ url: inputUrl, username, password }: App, files: Express.Multer.File[]): Promise<AxiosResponse> {
        const url = `${inputUrl}/jsonrpc`;

        const file = files[0];
        const nzo_id = v4();
        const requestBody: NZBGetAppendRequest = {
            method: 'append',
            params: [
                file.originalname, // NZB filename (empty for auto-detection)
                file.buffer.toString('base64'), // Base64-encoded NZB file
                'iplayer', // Category
                0, // Priority
                false, // Add to top
                false, // Add paused
                nzo_id, // Dupe key
                1000, // Dupe score
                'force', // Dupe mode
                [], // Post-processing parameters
            ],
            id: 1,
        };

        try {
            const response = await axios.post(`${url}/append`, requestBody, {
                auth: {
                    username: username as string,
                    password: password as string,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status == 200) {
                return {
                    status: 200,
                    data: {
                        status: true,
                        nzo_ids: [nzo_id],
                    },
                } as unknown as AxiosResponse;
            } else {
                return response;
            }
        } catch {
            return {
                status: 500,
                data: {
                    status: false,
                    nzo_ids: [],
                },
            } as unknown as AxiosResponse;
        }
    }
}

export default new NZBGetService();
