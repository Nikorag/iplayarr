import { AxiosResponse } from 'axios';
import { Request, Response } from 'express';
import nzbFacade from 'src/facade/nzbFacade';
import appService from 'src/service/entity/appService';
import loggingService from 'src/service/loggingService';
import queueService from 'src/service/queueService';
import { VideoType } from 'src/types/data/IPlayerSearchResult';
import { AppType } from 'src/types/enums/AppType';
import { App } from 'src/types/models/App';
import { NZBMetaEntry } from 'src/types/responses/newznab/NZBFileResponse';
import { Parser } from 'xml2js';

const parser = new Parser();

interface AddFileRequest {
    files: Express.Multer.File[]
}

interface NZBDetails {
    pid: string,
    nzbName: string,
    type: VideoType,
    appId?: string
}

interface DetailsRejection {
    err: any,
    nzbName: string,
}

export default async (req: Request, res: Response) => {
    const { files } = req as any as AddFileRequest;

    try {
        const details: NZBDetails[] = await Promise.all(files.map((file) => {
            const xmlString = file.buffer.toString('utf-8');
            return getDetails(xmlString);
        }));

        details.forEach(({ pid, nzbName, type, appId }) => queueService.addToQueue(pid, nzbName, type, appId));

        res.status(200).json({
            status: true,
            nzo_ids: details.map(({ pid }) => pid)
        });
    } catch (err : any) {
        const response = await nzbForward(err, files);
        if (response){
            res.status(response.status).send(response.data);
            return;
        } else {
            const rejection : DetailsRejection = err;
            res.status(500).json({
                status: false,
                error: rejection.err?.message || 'Unable to add NZB, Unknown Error'
            });
        }
    }
}

/**
 * 
 * Read the details from an NZB file
 * 
 * @param xml 
 * @returns 
 */
async function getDetails(xml: string): Promise<NZBDetails> {
    return new Promise((resolve, reject) => {
        parser.parseString(xml, (err, result) => {

            // Check for Errors
            if (err) {
                return reject({ err } as DetailsRejection);
            } else if (!result?.nzb?.head?.[0]?.title?.[0]) {
                const title: NZBMetaEntry = result.nzb.head[0].meta.find(({ $ }: any) => $.type === 'name');
                const nzbName: string | undefined = title ? title?._ : undefined;
                return reject({ isError: true, err: new Error('Invalid iPlayarr NZB File'), nzbName } as DetailsRejection);
            }

            const details: NZBDetails = {
                'pid': result.nzb.head[0].title[0],
                'nzbName': getMetaEntryValue(result, 'nzbName') as string,
                'type': getMetaEntryValue(result, 'type') as VideoType,
                'appId': getMetaEntryValue(result, 'app')
            }
            resolve(details);
        });
    });
}

function getMetaEntryValue(result: any, type: string): string | undefined {
    const metaEntry: NZBMetaEntry = result.nzb.head[0].meta.find(({ $ }: any) => $.type === type);
    return metaEntry ? metaEntry?.$?._ : undefined
}

async function nzbForward(rejection: DetailsRejection, files : Express.Multer.File[]) : Promise<AxiosResponse | undefined> {
    let allApps = await appService.all();
    allApps = allApps
        .filter(({ type }) => type == AppType.NZBGET || type == AppType.SABNZBD)
        .sort((a, b) => a.priority as number - (b.priority as number));

    for (const nzbApp of allApps) {   
        const response : AxiosResponse | undefined = await specificNzbForward(nzbApp, files, rejection);
        if (response) return response;   
    }

    return;
}

async function specificNzbForward(app : App, files : Express.Multer.File[], {nzbName} : DetailsRejection) : Promise<AxiosResponse | undefined>{
    const validApp = await nzbFacade.testConnection(
        app.type.toString(),
        app.url,
        app.api_key,
        app.username,
        app.password
    )
    if (validApp) {
        try {
            return await nzbFacade.addFile(app, files, nzbName);
        } catch (nzbErr) {
            loggingService.error(nzbErr);
            return;
        }
    }
}