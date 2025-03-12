import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

import { IplayarrParameter } from '../types/IplayarrParameters';
import configService from './configService';

const sabzbdService = {
    test : async () : Promise<boolean> => {
        const SABNZBD_URL = await configService.getParameter(IplayarrParameter.SABNZBD_URL);
        const SABNSBD_API_KEY = await configService.getParameter(IplayarrParameter.SABNZBD_API_KEY);
        if (SABNZBD_URL && SABNSBD_API_KEY){
            const result = await sabzbdService.testConnection(SABNZBD_URL, SABNSBD_API_KEY);
            if (result == true) {
                return true;
            }
        } 
        return false;
    },

    getAddFileUrl : async () : Promise<string> => {
        const SABNZBD_URL = await configService.getParameter(IplayarrParameter.SABNZBD_URL) as string;
        const SABNSBD_API_KEY = await configService.getParameter(IplayarrParameter.SABNZBD_API_KEY) as string;

        return `${SABNZBD_URL}/api?mode=addfile&cat=iplayer&priority=-100&apikey=${SABNSBD_API_KEY}`;
    },

    testConnection : async(sabnzbdUrl : string, apikey : string) : Promise<string | boolean> => {
        const url : string = `${sabnzbdUrl}/api?mode=queue&apikey=${apikey}`;

        try {
            const response = await axios.get(url);
            if (response.status == 200) return true;
            return false;
        } catch (error) {
            if (axios.isAxiosError(error)){
                return error.message;
            }
            return false;
        }
    },

    addFile : async(files : Express.Multer.File[]) : Promise<AxiosResponse> => {
        const url = await sabzbdService.getAddFileUrl();

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
                'Content-Type' : 'multipart/form-data'
            }
        });

        return response;
    }
}

export default sabzbdService;