import { AxiosResponse } from 'axios';
import { v4 } from 'uuid';

import historyService from '../service/historyService';
import loggingService from '../service/loggingService';
import NZBGetService from '../service/nzb/NZBGetService';
import SabNZBDService from '../service/nzb/SabNZBDService';
import { App } from '../types/App';
import { VideoType } from '../types/IPlayerSearchResult';
import { QueueEntry } from '../types/QueueEntry';
import { QueueEntryStatus } from '../types/responses/sabnzbd/QueueResponse';

class NZBFacade {
    async testConnection(
        type: string,
        url: string,
        apiKey?: string,
        username?: string,
        password?: string
    ): Promise<string | boolean> {
        const service = this.#getService(type);
        return service.testConnection(url, { username, password, apiKey });
    }

    #getService(type: string) {
        switch (type) {
            case 'sabnzbd':
            default:
                return SabNZBDService;
            case 'nzbget':
                return NZBGetService;
        }
    }

    async addFile(app: App, files: Express.Multer.File[], nzbName?: string): Promise<AxiosResponse> {
        loggingService.log(`Received Real NZB, trying to add ${nzbName} to ${app.name}`);
        this.createRelayEntry(app, nzbName);
        const service = this.#getService(app.type.toString().toLowerCase());
        return service.addFile(app, files);
    }

    createRelayEntry({ id: appId }: App, nzbName?: string): void {
        const relayEntry: QueueEntry = {
            pid: v4(),
            status: QueueEntryStatus.FORWARDED,
            nzbName: nzbName || 'Unknown',
            type: VideoType.UNKNOWN,
            appId,
            details: {
                start: new Date(),
            },
        };
        historyService.addRelay(relayEntry);
    }
}

export default new NZBFacade();
