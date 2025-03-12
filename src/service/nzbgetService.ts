import axios, { AxiosResponse } from 'axios';
import { v4 } from 'uuid';

import { IplayarrParameter } from '../types/IplayarrParameters';
import { NZBGetAppendRequest } from '../types/requests/nzbget/NZBGetAppendRequest';
import configService from './configService';

const nzbGetService = {
    test: async (): Promise<boolean> => {
        const url = await configService.getParameter(IplayarrParameter.NZB_URL);
        const username = await configService.getParameter(IplayarrParameter.NZB_USERNAME);
        const password = await configService.getParameter(IplayarrParameter.NZB_PASSWORD);
        if (url && username && password) {
            const result = await nzbGetService.testConnection(url, username, password);
            if (result == true) {
                return true;
            }
        }
        return false;
    },

    testConnection: async (inputUrl: string, username: string, password: string): Promise<string | boolean> => {
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
    },

    addFile: async (files: Express.Multer.File[]): Promise<AxiosResponse> => {
        const inputUrl = await configService.getParameter(IplayarrParameter.NZB_URL);
        const username = await configService.getParameter(IplayarrParameter.NZB_USERNAME) as string;
        const password = await configService.getParameter(IplayarrParameter.NZB_PASSWORD) as string;

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
                [] // Post-processing parameters
            ],
            id: 1
        };

        const response = await axios.post(`${url}/append`, requestBody, {
            auth: {
                username,
                password
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status == 200){
            return {
                status : 200,
                data : {
                    status: true,
                    nzo_ids: [nzo_id]
                }
            } as unknown as AxiosResponse
        } else {
            return response
        }
        return response;
    }
}

export default nzbGetService;