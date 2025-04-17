import { Request, Response } from 'express'
import { EndpointDirectory } from 'src/constants/EndpointDirectory';
import configService from 'src/service/configService';
import historyService from 'src/service/historyService';
import queueService from 'src/service/queueService';
import { IplayarrParameter } from 'src/types/enums/IplayarrParameters';
import { QueueEntry } from 'src/types/models/QueueEntry';
import { queueEntrySkeleton, QueueEntryStatus, queueSkeleton, QueueStatus, SabNZBDQueueResponse, SabNZBQueueEntry } from 'src/types/responses/sabnzbd/QueueResponse';
import { TrueFalseResponse } from 'src/types/responses/sabnzbd/TrueFalseResponse';

import { AbstractSabNZBDActionEndpoint, ActionQueryString } from './AbstractSabNZBDActionEndpoint';

function convertEntries(slot : QueueEntry, index : number) : SabNZBQueueEntry {
    return {
        ...queueEntrySkeleton,
        status : slot.status,
        index,
        mb: slot.details?.size || 0,
        mbleft: slot.details?.sizeLeft || 100,
        filename: slot.nzbName,
        timeleft: slot.details?.eta || '00:00:00',
        percentage: slot.details?.progress ? Math.trunc(slot.details.progress) : 0,
        nzo_id: slot.pid,
    } as SabNZBQueueEntry;
}

const actionDirectory : EndpointDirectory = {
    delete : async (req : Request, res : Response) => {
        const archive = (await configService.getParameter(IplayarrParameter.ARCHIVE_ENABLED)) == 'true';
        const {value} = req.query as ActionQueryString;
        if (value){
            queueService.cancelItem(value, archive);
            res.json({status:true} as TrueFalseResponse);
        } else {
            res.json({status:false} as TrueFalseResponse);
        }
	    return;
    },
    _default : async (req : Request, res : Response) => {
        const queue : QueueEntry[] = queueService.getQueue();
        const downloadQueue : QueueEntry[] = queue.filter(({status}) => status == QueueEntryStatus.DOWNLOADING);
        const iplayerComplete = await historyService.getHistory();
        const queueResponse : SabNZBDQueueResponse = {
            ...queueSkeleton,
            status : downloadQueue.length > 0 ? QueueStatus.DOWNLOADING : QueueStatus.IDLE,
            noofslots_total : queue.length,
            noofslots : queue.length,
            finish: iplayerComplete.length,
            slots : queue.map(convertEntries)
        } as SabNZBDQueueResponse;
        res.json({queue : queueResponse});
    }
}

export default new AbstractSabNZBDActionEndpoint(actionDirectory).handler;