import { H3Event, readMultipartFormData, setResponseStatus } from 'h3';
import { Parser } from 'xml2js';

import nzbFacade from '../../facade/nzbFacade';
import appService from '../../service/appService';
import loggingService from '../../service/loggingService';
import queueService from '../../service/queueService';
import { AppType } from '../../types/AppType';
import { VideoType } from '../../types/IPlayerSearchResult';
import { NZBMetaEntry } from '../../types/responses/newznab/NZBFileResponse';
import { UploadedFile } from '../../types/UploadedFile';

const parser = new Parser();

interface NZBDetails {
    pid: string;
    nzbName: string;
    type: VideoType;
    appId?: string;
}

interface DetailsRejection {
    err: any;
    nzbName: string;
}

async function getUploadedFiles(event: H3Event): Promise<UploadedFile[]> {
    const parts = (await readMultipartFormData(event)) ?? [];
    return parts
        .filter(({ filename }) => filename !== undefined)
        .map(({ name, filename, type, data }) => ({
            fieldname: name ?? '',
            originalname: filename as string,
            mimetype: type ?? 'application/octet-stream',
            buffer: data,
        }));
}

export default async (event: H3Event) => {
    const files = await getUploadedFiles(event);
    try {
        const pids: string[] = [];
        for (const file of files) {
            const xmlString = file.buffer.toString('utf-8');
            const { pid, nzbName, type, appId } = await getDetails(xmlString);
            queueService.addToQueue(pid, nzbName, type, appId);
            pids.push(pid);
        }

        return {
            status: true,
            nzo_ids: pids,
        };
    } catch (err: any) {
        const rejection = err as DetailsRejection;
        let allApps = await appService.getAllApps();
        allApps = allApps
            .filter(({ type }) => type == AppType.NZBGET || type == AppType.SABNZBD)
            .sort((a, b) => (a.priority as number) - (b.priority as number));
        for (const nzbApp of allApps) {
            const validApp = await nzbFacade.testConnection(
                nzbApp.type.toString(),
                nzbApp.url,
                nzbApp.api_key,
                nzbApp.username,
                nzbApp.password
            );
            if (validApp) {
                try {
                    const response = await nzbFacade.addFile(nzbApp, files, rejection.nzbName);
                    setResponseStatus(event, response.status);
                    return response.data;
                } catch (nzbErr) {
                    loggingService.error(nzbErr);
                }
            }
        }
        setResponseStatus(event, 500);
        return {
            status: false,
            error: rejection.err?.message || 'Unable to add NZB, Unknown Error',
        };
    }
};

async function getDetails(xml: string): Promise<NZBDetails> {
    return new Promise((resolve, reject) => {
        parser.parseString(xml, (err, result) => {
            if (err) {
                return reject({ err } as DetailsRejection);
            } else if (!result?.nzb?.head?.[0]?.title?.[0]) {
                const title: NZBMetaEntry = result.nzb.head[0].meta.find(({ $ }: any) => $.type === 'name');
                const nzbName: string | undefined = title ? title?._ : undefined;
                return reject({
                    isError: true,
                    err: new Error('Invalid iPlayarr NZB File'),
                    nzbName,
                } as DetailsRejection);
            }
            const nzbName: NZBMetaEntry = result.nzb.head[0].meta.find(({ $ }: any) => $.type === 'nzbName');
            const type: NZBMetaEntry = result.nzb.head[0].meta.find(({ $ }: any) => $.type === 'type');
            const app: NZBMetaEntry = result.nzb.head[0].meta.find(({ $ }: any) => $.type === 'app');
            const details: NZBDetails = {
                pid: result.nzb.head[0].title[0],
                nzbName: nzbName?.$?._,
                type: type?.$?._ as VideoType,
                appId: app ? app?.$?._ : undefined,
            };
            resolve(details);
        });
    });
}
