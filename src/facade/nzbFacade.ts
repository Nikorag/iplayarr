import { AxiosResponse } from 'axios';
import historyService from 'src/service/entity/historyService';
import loggingService from 'src/service/loggingService';
import nzbGetService from 'src/service/nzbgetService';
import sabzbdService from 'src/service/sabnzbdService';
import { VideoType } from 'src/types/data/IPlayerSearchResult';
import { AppType } from 'src/types/enums/AppType';
import { App } from 'src/types/models/App';
import { QueueEntry } from 'src/types/models/QueueEntry';
import { QueueEntryStatus } from 'src/types/responses/sabnzbd/QueueResponse';
import { v4 } from 'uuid';

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
        const pid = v4();
        const relayEntry : QueueEntry = {
            pid,
            id : pid,
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