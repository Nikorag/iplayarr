import { Request, Response } from 'express';
import { Builder } from 'xml2js';

import configService from '../../service/configService';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import { VideoType } from '../../types/IPlayerSearchResult';
import { NZBFileResponse, NZBMetaEntry } from '../../types/responses/newznab/NZBFileResponse';

interface DownloadNZBRequest {
    pid: string;
    nzbName: string;
    type: VideoType;
    app?: string;
}

export default async (req: Request, res: Response) => {
    const { pid, nzbName, type, app } = req.query as any as DownloadNZBRequest;

    const date: Date = new Date();
    date.setMinutes(date.getMinutes() - 720);

    const outputFormat = await configService.getParameter(IplayarrParameter.OUTPUT_FORMAT);

    const builder: Builder = new Builder({
        headless: true,
        renderOpts: { pretty: true },
    });

    const meta: NZBMetaEntry[] = [
        {
            $: {
                type: 'nzbName',
                _: nzbName,
            },
        },
        {
            $: {
                type: 'type',
                _: type,
            },
        },
    ];

    if (app) {
        meta.push({
            $: {
                type: 'app',
                _: app,
            },
        });
    }

    const nzbFile: NZBFileResponse = {
        $: {
            xmlns: 'http://www.newzbin.com/DTD/2003/nzb',
        },
        head: {
            title: pid,
            meta,
        },
        file: {
            $: {
                poster: 'iplayer@bbc.com',
                date: date.getTime(),
                subject: `${nzbName}.${outputFormat}`,
            },
            groups: {
                group: ['alt.binaries.example'],
            },
            segments: {
                segment: [{ _: `${pid}@news.example.com`, $: { bytes: 2147483648, number: 1 } }],
            },
        },
    };

    const xml: string = builder.buildObject({ nzb: nzbFile });
    const finalXml: string =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN" "http://www.newzbin.com/DTD/2003/nzb-1.1.dtd">\n' +
        xml;

    res.set('Content-Type', 'application/x-nzb');
    res.send(finalXml);
};
