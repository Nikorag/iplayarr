import { AxiosResponse } from 'axios';

import loggingService from '../service/loggingService';
import nzbGetService from '../service/nzbgetService';
import sabzbdService from '../service/sabnzbdService';
import { AppType } from '../shared/types/enums/AppType';
import { App } from '../shared/types/models/App';

const nzbFacade = {
    testConnection : async (type : string, url : string, apiKey? : string, username? : string, password? : string) : Promise<string | boolean> => {
        switch (type){
        case 'sabnzbd':
        default:    
            return sabzbdService.testConnection(url, apiKey as string);
        case 'nzbget':
            return nzbGetService.testConnection(url, username as string, password as string);    
        }
    },

    addFile: async (app : App, files: Express.Multer.File[]): Promise<AxiosResponse> => {
        loggingService.log(`Received Real NZB, trying to add to ${app.name}`);
        switch (app.type){
        case AppType.SABNZBD:
        default:
            return sabzbdService.addFile(app, files);
        case AppType.NZBGET:
            return nzbGetService.addFile(app, files); 
        }
    }
}

export default nzbFacade;