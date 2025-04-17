import { Request, Response } from 'express'
import { EndpointDirectory } from 'src/constants/EndpointDirectory'
import { sizeFactor } from 'src/constants/iPlayarrConstants'
import configService from 'src/service/configService'
import historyService from 'src/service/entity/historyService'
import { IplayarrParameter } from 'src/types/enums/IplayarrParameters'
import { QueueEntry } from 'src/types/models/QueueEntry'
import { historyEntrySkeleton, historySkeleton, SABNZBDHistoryEntryResponse, SabNZBDHistoryResponse } from 'src/types/responses/sabnzbd/HistoryResponse'
import { QueueEntryStatus } from 'src/types/responses/sabnzbd/QueueResponse'
import { TrueFalseResponse } from 'src/types/responses/sabnzbd/TrueFalseResponse'
import { formatBytes } from 'src/utils/Utils'

import { AbstractSabNZBDActionEndpoint, ActionQueryString } from './AbstractSabNZBDActionEndpoint'

const actionDirectory : EndpointDirectory = {
    delete : async (req : Request, res : Response) => {
        const {value} = req.query as ActionQueryString;
        if (value){
            await historyService.removeItem(value)
            res.json({status:true} as TrueFalseResponse);
        } else {
            res.json({status:false} as TrueFalseResponse);
        }
	    return;
    },

    _default : async (req : Request, res : Response) => {
        let history : QueueEntry[] = await historyService.all();
        history = history.filter(({status}) => status != QueueEntryStatus.FORWARDED && status != QueueEntryStatus.CANCELLED);
        const completeDir : string = await configService.getParameter(IplayarrParameter.COMPLETE_DIR) as string;

        const historyObject : SabNZBDHistoryResponse = {
            ...historySkeleton,
            slots : history.filter(({status}) => status != QueueEntryStatus.FORWARDED).map((item) => createHistoryEntry(completeDir, item))
        } as SabNZBDHistoryResponse
        res.json({history : historyObject});
    }
}

function createHistoryEntry(completeDir : string, item : QueueEntry) : SABNZBDHistoryEntryResponse {
    return {
        ...historyEntrySkeleton,
        duplicate_key : item.pid,
        size : formatBytes(item.details?.size as number * sizeFactor),
        nzb_name: `${item.nzbName}.nzb`,
        storage : `${completeDir}/${item.nzbName}.mp4`,
        completed : item.details?.size as number * sizeFactor,
        downloaded : item.details?.size as number * sizeFactor,
        nzo_id: item.pid,
        path : `${completeDir}/${item.nzbName}.mp4`,
        name: `${item.nzbName}.mp4`,
        url: `${item.nzbName}.nzb`,
        bytes: item.details?.size as number * sizeFactor
    } as SABNZBDHistoryEntryResponse
}

export default new AbstractSabNZBDActionEndpoint(actionDirectory).handler;