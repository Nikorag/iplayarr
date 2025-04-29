import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

import { App } from '../types/App';

const sabzbdService = {
    getAddFileUrl: async ({ url, api_key }: App): Promise<string> => {
        return `${url}/api?mode=addfile&cat=iplayer&priority=-100&apikey=${api_key}`;
    },

    testConnection: async (sabnzbdUrl: string, apikey: string): Promise<string | boolean> => {
        const url: string = `${sabnzbdUrl}/api?mode=queue&apikey=${apikey}`;

        try {
            const response = await axios.get(url);
            if (response.status == 200) return true;
            return false;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return error.message;
            }
            return false;
        }
    },

    addFile: async (app: App, files: Express.Multer.File[]): Promise<AxiosResponse> => {
        const url = await sabzbdService.getAddFileUrl(app);

        const formData = new FormData();
        if (files) {
            files.forEach((file) => {
                formData.append('nzbfile', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype,
                });
            });
        }

        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response;
    },
};

export default sabzbdService;
