import { Request, Response } from 'express';
import { Parser } from 'xml2js';

import nzbFacade from '../../facade/nzbFacade';
import appService from '../../service/appService';
import loggingService from '../../service/loggingService';
import queueService from '../../service/queueService';
import { AppType } from '../../types/enums/AppType';
import { VideoType } from '../../types/responses/iplayer/IPlayerSearchResult';
import { NZBMetaEntry } from '../../types/responses/newznab/NZBFileResponse';

const parser = new Parser();

interface AddFileRequest {
    files : Express.Multer.File[]
}

interface NZBDetails {
    pid : string,
    nzbName : string,
    type : VideoType,
    appId? : string
}

export default async (req : Request, res : Response) => {
    const { files } = req as any as AddFileRequest;
    try {
        
        const pids : string[] = [];
        for (const file of files){
            const xmlString = file.buffer.toString('utf-8');
            const {pid, nzbName, type, appId} = await getDetails(xmlString);
            queueService.addToQueue(pid, nzbName, type, appId);
            pids.push(pid);
        }

        res.status(200).json({
            status: true,
            nzo_ids: pids
        });
    } catch (error : any) {
        let allApps = await appService.all();
        allApps = allApps
            .filter(({type}) => type == AppType.NZBGET || type == AppType.SABNZBD)
            .sort((a, b) => a.priority as number - (b.priority as number));
        for (const nzbApp of allApps){
            const validApp = await nzbFacade.testConnection(
                nzbApp.type.toString(),
                nzbApp.url,
                nzbApp.api_key,
                nzbApp.username,
                nzbApp.password
            )
            if (validApp){
                try {
                    const response = await nzbFacade.addFile(nzbApp, files);
                    res.status(response.status).send(response.data);
                    return;
                } catch (nzbErr) {
                    loggingService.error(nzbErr);
                }
            }
        }
        res.status(500).json({
            status: false,
            error: error.message
        });
    }
}

async function getDetails(xml : string) : Promise<NZBDetails> {
    return new Promise((resolve, reject) => {
        parser.parseString(xml, (err, result) => {
            if (err) {
                return reject(err);
            } else if (!result?.nzb?.head?.[0]?.title?.[0]){
                return reject(new Error('Invalid iPlayarr NZB File'));
	    }
            const nzbName : NZBMetaEntry = result.nzb.head[0].meta.find(({$} : any) => $.type === 'nzbName');
            const type : NZBMetaEntry = result.nzb.head[0].meta.find(({$} : any) => $.type === 'type');
            const app : NZBMetaEntry = result.nzb.head[0].meta.find(({$} : any) => $.type === 'app');
            const details : NZBDetails = {
                'pid' : result.nzb.head[0].title[0],
                'nzbName' : nzbName?.$?._,
                'type' : (type?.$?._) as VideoType,
                'appId' : app ? app?.$?._ : undefined
            }
            resolve(details);
        });
    });
}
