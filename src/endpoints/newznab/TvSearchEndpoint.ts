import { Request, Response } from "express";
import { Builder } from "xml2js"
import iplayerService from "../../service/iplayerService";
import { IPlayerSearchResult } from "../../types/IPlayerSearchResult";
import { getBaseUrl } from "../../utils/Utils";
import { TVSearchResponse } from "../../types/responses/newznab/TVSearchResponse";

interface TvSearchRequest {
    q : string,
    season : number,
    ep : number
}

export default async (req : Request, res : Response) => {
    const {q, season, ep} = req.query as any as TvSearchRequest;
    const searchTerm = q ?? '*';
    const results : IPlayerSearchResult[] = await iplayerService.tvSearch(searchTerm, season, ep)

    const date : Date = new Date();
    date.setMinutes(date.getMinutes() - 720);

    const pubDate : string = date.toUTCString().replace("GMT", "+0000");

    const searchResponse : TVSearchResponse = {
        $: {
            version: "1.0",
            "xmlns:atom": "http://www.w3.org/2005/Atom",
            "xmlns:newznab": "http://www.newznab.com/DTD/2010/feeds/attributes/"
        },
        channel: {
            "atom:link": { $: { rel: "self", type: "application/rss+xml" } },
            title: "iPlayarr",
            item: results.map(({title, pid, nzbName}) => (
                {
                    title: nzbName,
                    description: nzbName,
                    guid: `https://www.bbc.co.uk/iplayer/episodes/${pid}`,
                    size: "2147483648",
                    category: ["5000", "5040"],
                    pubDate,
                    "newznab:attr": [
                      { $: { name: "category", value: "5000" } },
                      { $: { name: "category", value: "5040" } },
                      { $: { name: "language", value: "English" } },
                      { $: { name: "files", value: "1" } },
                      { $: { name: "grabs", value: "0" } }
                    ],
                    link: `${getBaseUrl(req)}/api?mode=nzb-download&pid=${pid}&nzbName=${nzbName}&apikey=${req.query.apikey}`,
                    enclosure: {$:{url : `${getBaseUrl(req)}/api?mode=nzb-download&pid=${pid}&nzbName=${nzbName}&apikey=${req.query.apikey}`, length : "2147483648", type: "application/x-nzb"} } 
                  }
            ))
        }
    } as TVSearchResponse

    const builder = new Builder({ headless: false, xmldec: { version: "1.0", encoding: "UTF-8" } });
    const xml = builder.buildObject({rss : searchResponse});

    res.set("Content-Type", "application/xml");
    res.send(xml);
}