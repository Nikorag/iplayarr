import { AxiosResponse } from 'axios';
import { v4 } from 'uuid';

import historyService from '../service/historyService';
import loggingService from '../service/loggingService';
import nzbGetService from '../service/nzbgetService';
import sabzbdService from '../service/sabnzbdService';
import { App } from '../types/App';
import { AppType } from '../types/AppType';
import { VideoType } from '../types/IPlayerSearchResult';
import { QueueEntry } from '../types/QueueEntry';
import { QueueEntryStatus } from '../types/responses/sabnzbd/QueueResponse';

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

    addFile: async (app : App, files: Express.Multer.File[], nzbName? : string): Promise<AxiosResponse> => {
        loggingService.log(`Received Real NZB, trying to add ${nzbName} to ${app.name}`);
        nzbFacade.createRelayEntry(app, nzbName)
        switch (app.type){
        case AppType.SABNZBD:
        default:
            return sabzbdService.addFile(app, files);
        case AppType.NZBGET:
            return nzbGetService.addFile(app, files); 
        }
    },

    createRelayEntry: ({id : appId} : App, nzbName?: string) : void => {
        const relayEntry : QueueEntry = {
            pid: v4(),
            status: QueueEntryStatus.FORWARDED,
            nzbName : nzbName || 'Unknown',
            type: VideoType.UNKNOWN,
            appId,
            details : {
                start : new Date()
            }
        }
        historyService.addRelay(relayEntry);
    }
}

export default nzbFacade;