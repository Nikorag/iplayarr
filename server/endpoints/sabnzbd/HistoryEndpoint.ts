import { getQuery, H3Event } from 'h3';

import { EndpointDirectory } from '../../constants/EndpointDirectory';
import configService from '../../service/configService';
import historyService from '../../service/historyService';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import { QueueEntry } from '../../types/QueueEntry';
import {
    historyEntrySkeleton,
    historySkeleton,
    SABNZBDHistoryEntryResponse,
    SabNZBDHistoryResponse,
} from '../../types/responses/sabnzbd/HistoryResponse';
import { QueueEntryStatus } from '../../types/responses/sabnzbd/QueueResponse';
import { TrueFalseResponse } from '../../types/responses/sabnzbd/TrueFalseResponse';
import { formatBytes } from '../../utils/formatters';
import { AbstractSabNZBDActionEndpoint, ActionQueryString } from './AbstractSabNZBDActionEndpoint';

const sizeFactor: number = 1048576;

const actionDirectory: EndpointDirectory = {
    delete: async (event: H3Event) => {
        const archive = (await configService.getParameter(IplayarrParameter.ARCHIVE_ENABLED)) == 'true';
        const { value } = getQuery(event) as ActionQueryString;
        if (value) {
            await historyService.removeHistory(value, archive);
            return { status: true } as TrueFalseResponse;
        }
        return { status: false } as TrueFalseResponse;
    },

    _default: async () => {
        let history: QueueEntry[] = await historyService.getHistory();
        history = history.filter(
            ({ status }) => status != QueueEntryStatus.FORWARDED && status != QueueEntryStatus.CANCELLED && status != QueueEntryStatus.REMOVED
        );
        const completeDir: string = (await configService.getParameter(IplayarrParameter.COMPLETE_DIR)) as string;

        const outputFormat = await configService.getParameter(IplayarrParameter.OUTPUT_FORMAT) as string;

        const historyObject: SabNZBDHistoryResponse = {
            ...historySkeleton,
            slots: history
                .filter(({ status }) => status != QueueEntryStatus.FORWARDED)
                .map((item) => createHistoryEntry(completeDir, item, outputFormat)),
        } as SabNZBDHistoryResponse;
        return { history: historyObject };
    }
};

function createHistoryEntry(completeDir: string, item: QueueEntry, outputFormat: string): SABNZBDHistoryEntryResponse {
    return {
        ...historyEntrySkeleton,
        duplicate_key: item.pid,
        size: formatBytes((item.details?.size as number) * sizeFactor),
        nzb_name: `${item.nzbName}.nzb`,
        storage: `${completeDir}/${item.nzbName}.${outputFormat}`,
        completed: (item.details?.size as number) * sizeFactor,
        downloaded: (item.details?.size as number) * sizeFactor,
        nzo_id: item.pid,
        path: `${completeDir}/${item.nzbName}.${outputFormat}`,
        name: `${item.nzbName}.${outputFormat}`,
        url: `${item.nzbName}.nzb`,
        bytes: (item.details?.size as number) * sizeFactor,
    } as SABNZBDHistoryEntryResponse;
}

export default new AbstractSabNZBDActionEndpoint(actionDirectory).handler;