import { Request, Response, NextFunction } from "express"
import { EndpointDirectory } from "../EndpointDirectory"
import { TrueFalseResponse } from "../../types/responses/sabnzbd/TrueFalseResponse"
import historyService from "../../service/historyService"
import { getParameter } from "../../service/configService"
import { IplayarrParameter } from "../../types/IplayarrParameters"
import { historyEntrySkeleton, historySkeleton, SABNZBDHistoryEntryResponse, SabNZBDHistoryResponse } from "../../types/responses/sabnzbd/HistoryResponse"
import { formatBytes } from "../../utils/Utils"
import { QueueEntry } from "../../types/QueueEntry"

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
        const completeDir : string = await getParameter(IplayarrParameter.COMPLETE_DIR) as string;

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
        size : formatBytes(item.details?.size as number),
        nzb_name: `${item.nzbName}.nzb`,
        storage : `${completeDir}/${item.nzbName}.mp4`,
        completed : item.details?.size as number,
        downloaded : item.details?.size as number,
        nzo_id: item.pid,
        path : `${completeDir}/${item.nzbName}.mp4`,
        name: `${item.nzbName}.mp4`,
        url: `${item.nzbName}.nzb`,
        bytes: item.details?.size as number
    } as SABNZBDHistoryEntryResponse
}

const actionDirectory : EndpointDirectory = {
    delete : async (req : Request, res : Response, next : NextFunction) => {
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