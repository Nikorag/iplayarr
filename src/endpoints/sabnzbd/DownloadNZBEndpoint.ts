import { Request, Response } from 'express';
import { VideoType } from 'src/types/data/IPlayerSearchResult';
import { NZBFileResponse, NZBMetaEntry } from 'src/types/responses/newznab/NZBFileResponse';
import { Builder } from 'xml2js';

interface DownloadNZBQueryString {
    pid : string,
    nzbName : string,
    type : VideoType,
    app? : string
}

export default async (req : Request, res : Response) => {
    const { pid, nzbName, type, app } = req.query as any as DownloadNZBQueryString;

    const builder : Builder = new Builder({
        headless: true,
        renderOpts: { pretty: true }
    });

    const meta : NZBMetaEntry[] = [
        {
            $: {
                type: 'nzbName',
                _: nzbName
            }
        },
        {
            $: {
                type: 'type',
                _: type
            }
        }
    ]

    if (app){
        meta.push({
            $: {
                type: 'app',
                _: app
            }
        })
    }

    const nzbFile : NZBFileResponse = {
        $: {
            xmlns: 'http://www.newzbin.com/DTD/2003/nzb'
        },
        head: {
            title: pid,
            meta
        },
        file: {
            $: {
                poster: 'iplayer@bbc.com',
                date: getDefaultAge(),
                subject: `${nzbName}.mp4`
            },
            groups: {
                group: ['alt.binaries.example']
            },
            segments: {
                segment: [{ _: `${pid}@news.example.com`, $: { bytes: 2147483648, number: 1 } }]
            }
        }
    } 

    const xml : string = builder.buildObject({nzb : nzbFile});
    const finalXml : string = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                     '<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN" "http://www.newzbin.com/DTD/2003/nzb-1.1.dtd">\n' +
                     xml;

    res.set('Content-Type', 'application/x-nzb');
    res.send(finalXml);
};


function getDefaultAge() : number {
    const date : Date = new Date();
    date.setMinutes(date.getMinutes() - 720);
    return date.getTime();
}