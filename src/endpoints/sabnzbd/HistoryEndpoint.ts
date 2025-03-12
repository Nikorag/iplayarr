import { NextFunction,Request, Response } from 'express'

import configService from '../../service/configService'
import historyService from '../../service/historyService'
import { IplayarrParameter } from '../../types/IplayarrParameters'
import { QueueEntry } from '../../types/QueueEntry'
import { historyEntrySkeleton, historySkeleton, SABNZBDHistoryEntryResponse, SabNZBDHistoryResponse } from '../../types/responses/sabnzbd/HistoryResponse'
import { TrueFalseResponse } from '../../types/responses/sabnzbd/TrueFalseResponse'
import { formatBytes } from '../../utils/Utils'
import { EndpointDirectory } from '../EndpointDirectory'

const sizeFactor : number = 1048576; 

interface HistoryQuery {
    name? : string
    value? : string
}

export default async (req : Request, res : Response, next : NextFunction) => {
    const {name} = req.query as HistoryQuery;
    if (name && actionDirectory[name]){
        actionDirectory[name](req, res, next);
        return
    } else {
        const history : QueueEntry[] = await historyService.getHistory();
        const completeDir : string = await configService.getParameter(IplayarrParameter.COMPLETE_DIR) as string;

        const historyObject : SabNZBDHistoryResponse = {
            ...historySkeleton,
            slots : history.map((item) => createHistoryEntry(completeDir, item))
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

const actionDirectory : EndpointDirectory = {
    delete : async (req : Request, res : Response) => {
        const {value} = req.query as HistoryQuery;
        if (value){
            await historyService.removeHistory(value)
            res.json({status:true} as TrueFalseResponse);
        } else {
            res.json({status:false} as TrueFalseResponse);
        }
	    return;
    }
}
