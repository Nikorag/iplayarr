import { AxiosResponse } from 'axios';

import configService from '../service/configService';
import nzbGetService from '../service/nzbgetService';
import sabzbdService from '../service/sabnzbdService';
import { IplayarrParameter } from '../types/IplayarrParameters';

const nzbFacade = {
    test : async () : Promise<boolean> => {
        const type = await configService.getParameter(IplayarrParameter.NZB_TYPE);
        switch (type){
            case 'sabnzbd':
            default:
                return sabzbdService.test();
            case 'nzbget':
                return nzbGetService.test();    
        }
    },

    testConnection : async (type : string, url : string, apiKey : string, username : string, password : string) : Promise<string | boolean> => {
        switch (type){
            case 'sabnzbd':
            default:    
                return sabzbdService.testConnection(url, apiKey);
            case 'nzbget':
                return nzbGetService.testConnection(url, username, password);    
        }
    },

    addFile: async (files: Express.Multer.File[]): Promise<AxiosResponse> => {
        const type = await configService.getParameter(IplayarrParameter.NZB_TYPE);
        switch (type){
            case 'sabnzbd':
            default:
                return sabzbdService.addFile(files);
            case 'nzbget':
                return nzbGetService.addFile(files); 
        }
    }
}

export default nzbFacade;