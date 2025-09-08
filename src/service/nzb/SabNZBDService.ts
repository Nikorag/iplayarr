import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

import { App } from '../../types/App';
import AbstractNZBService from './AbstractNZBService';

class SabNZBDService implements AbstractNZBService {
    getAddFileUrl({ url, api_key }: App): string {
        return `${url}/api?mode=addfile&cat=iplayer&priority=-100&apikey=${api_key}`;
    }

    async testConnection(sabnzbdUrl: string, { apiKey }: any): Promise<string | boolean> {
        const url: string = `${sabnzbdUrl}/api?mode=queue&apikey=${apiKey}`;

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
    }

    async addFile(app: App, files: Express.Multer.File[]): Promise<AxiosResponse> {
        const url = this.getAddFileUrl(app);

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
    }

}

export default new SabNZBDService();
