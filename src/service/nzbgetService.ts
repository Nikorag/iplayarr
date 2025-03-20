import axios, { AxiosResponse } from 'axios';
import { v4 } from 'uuid';

import { App } from '../shared/types/models/App';
import { NZBGetAppendRequest } from '../shared/types/requests/nzbget/NZBGetAppendRequest';

const nzbGetService = {
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

    addFile: async ({url : inputUrl, username, password} : App, files: Express.Multer.File[]): Promise<AxiosResponse> => {
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
                username : username as string,
                password : password as string
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