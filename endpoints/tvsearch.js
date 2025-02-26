import { Builder } from "xml2js";
import iplayerService from "../service/iplayerService.js";
import { getBaseUrl } from "../utils/utils.js";

export default async (req, res) => {
    const {q, season, ep} = req.query;
    const searchTerm = q ?? '*';
    const results = await iplayerService.search(searchTerm, season, ep);

    const date = new Date();
    date.setMinutes(date.getMinutes() - 720);

    const pubDate = date.toUTCString().replace("GMT", "+0000");

    const json = {
        rss: {
            $: {
                version: "1.0",
                "xmlns:atom": "http://www.w3.org/2005/Atom",
                "xmlns:newznab": "http://www.newznab.com/DTD/2010/feeds/attributes/"
            },
            channel: {
                "atom:link": { $: { rel: "self", type: "application/rss+xml" } },
                title: "iPlayarr",
                item: results.map(({show, id, nzbName}) => (
                    {
                        title: nzbName,
                        description: nzbName,
                        guid: `https://www.bbc.co.uk/iplayer/episodes/${id}`,
                        size: "2147483648",
                        category: ["5000", "5040"],
                        pubDate,
                        "newznab:attr": [
                          { $: { name: "category", value: "5000" } },
                          { $: { name: "category", value: "5040" } },
                          { $: { name: "language", value: "English" } },
                          { $: { name: "files", value: "0" } },
                          { $: { name: "grabs", value: "0" } }
                        ],
                        link: `${getBaseUrl(req)}/api?mode=nzb-download&pid=${id}&nzbName=${nzbName}&apikey=${req.query.apikey}`,
                        enclosure: {$:{url : `${getBaseUrl(req)}/api?mode=nzb-download&pid=${id}&nzbName=${nzbName}&apikey=${req.query.apikey}`, length : "2147483648", type: "application/x-nzb"} } 
                      }
                ))
            }
        }
    };

    const builder = new Builder({ headless: false, xmldec: { version: "1.0", encoding: "UTF-8" } });
    const xml = builder.buildObject(json);

    res.set("Content-Type", "application/xml");
    res.send(xml);
}