import { Parser } from "xml2js";
import iplayerService from "../service/iplayerService.js";
import queueService from "../service/queueService.js";

const parser = new Parser();

export default async (req, res) => {
    try {
        const { files } = req;
        const pids = [];
        for (const file of files){
            const xmlString = file.buffer.toString('utf-8');
            const {pid, nzbName} = await getDetails(xmlString);
            queueService.addToQueue(pid, nzbName);
            pids.push(pid);
        }

        res.status(200).json({
            status: true,
            nzo_ids: pids
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        });
    }
}

async function getDetails(xml) {
    return new Promise((resolve, reject) => {
        parser.parseString(xml, (err, result) => {
            if (err || !result?.nzb?.head?.[0]?.title?.[0]) {
                return reject(err);
            }
            const nzbName = result.nzb.head[0].meta.find(({$}) => $.type === 'nzbName');
            const details = {
                "pid" : result.nzb.head[0].title[0],
                "nzbName" : nzbName?.$?._,

            }
            resolve(details);
        });
    });
}