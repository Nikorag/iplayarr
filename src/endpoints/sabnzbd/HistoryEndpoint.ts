import { Request, Response } from 'express';

import { EndpointDirectory } from '../../constants/EndpointDirectory';
import configService from '../../service/configService';
import historyService from '../../service/historyService';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import { HistoryEntry } from '../../types/QueueEntry';
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
    delete: async (req: Request, res: Response) => {
        const archive = (await configService.getParameter(IplayarrParameter.ARCHIVE_ENABLED)) == 'true';
        const { value } = req.query as ActionQueryString;
        if (value) {
            await historyService.removeHistory(value, archive);
            res.json({ status: true } as TrueFalseResponse);
        } else {
            res.json({ status: false } as TrueFalseResponse);
        }
        return;
    },

    _default: async (req: Request, res: Response) => {
        let history: HistoryEntry[] = await historyService.getHistory();
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
        res.json({ history: historyObject });
    }
};

function createHistoryEntry(completeDir: string, item: HistoryEntry, outputFormat: string): SABNZBDHistoryEntryResponse {
    const bytes = Math.round((item.details?.size ?? 0) * sizeFactor);
    const completed = getHistoryTimestamp(item);

    return {
        ...historyEntrySkeleton,
        duplicate_key: item.pid,
        size: formatBytes(bytes),
        category: item.category || historyEntrySkeleton.category,
        nzb_name: `${item.nzbName}.nzb`,
        storage: `${completeDir}/${item.nzbName}.${outputFormat}`,
        completed,
        downloaded: bytes,
        nzo_id: item.pid,
        path: `${completeDir}/${item.nzbName}.${outputFormat}`,
        name: `${item.nzbName}.${outputFormat}`,
        url: `${item.nzbName}.nzb`,
        bytes,
    } as SABNZBDHistoryEntryResponse;
}

function getHistoryTimestamp(item: HistoryEntry): number {
    return parseTimestampSeconds(item.completedAt) ?? parseTimestampSeconds(item.details?.start) ?? 0;
}

function parseTimestampSeconds(value: Date | string | undefined): number | undefined {
    if (!value) {
        return undefined;
    }

    const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
    return Number.isNaN(parsed) ? undefined : Math.floor(parsed / 1000);
}

export default new AbstractSabNZBDActionEndpoint(actionDirectory).handler;
