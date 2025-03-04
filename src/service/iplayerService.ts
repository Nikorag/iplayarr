import { ChildProcess, spawn } from "child_process";
import sonarrService from "./sonarrService";
import NodeCache from "node-cache";
import { getParameter } from "./configService";
import { IplayarrParameter } from "../types/IplayarrParameters";
import loggingService from "./loggingService";
import { IPlayerSearchResult } from "../types/IPlayerSearchResult";
import { createNZBName, legacyCreateNZBName } from "../utils/Utils";
import { v4 } from "uuid";
import fs from 'fs';
import queueService from "./queueService";
import socketService from "./socketService";
import { DownloadDetails } from "../types/DownloadDetails";
import path from "path";
import historyService from "./historyService";
import { QueueEntry } from "../types/QueueEntry";
import synonymService from "./synonymService";
import { Synonym } from "../types/Synonym";

const episodeRegex = /([0-9]+:)[^a-zA-Z]([^,]+),[^a-zA-Z]([^,]+),[^a-zA-Z]([^,]+)(?:$|\n)/;
const progressRegex = /([\d.]+)% of ~?([\d.]+ [A-Z]+) @[ ]+([\d.]+ [A-Za-z]+\/s) ETA: ([\d:]+).*$/;
const searchCache : NodeCache = new NodeCache({stdTTL: 300, checkperiod: 60});

const timestampFile = 'iplayarr_timestamp';

const iplayerService = {
    download : async (pid : string) : Promise<ChildProcess> => {
        const uuid : string = v4();
        const downloadDir = await getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;
        const completeDir = await getParameter(IplayarrParameter.COMPLETE_DIR) as string;

        const [exec, args] = await getIPlayerExec();
        fs.mkdirSync(`${downloadDir}/${uuid}`);
        fs.writeFileSync(`${downloadDir}/${uuid}/${timestampFile}`, '');
        const allArgs = [...args, '--output', `${downloadDir}/${uuid}`, '--overwrite', '--force', '--log-progress', `--pid=${pid}`];

        loggingService.debug(`Executing get_iplayer with args: ${allArgs.join(" ")}`);
        const downloadProcess = spawn(exec as string, allArgs);

        downloadProcess.stdout.on('data', (data) => {
            if (queueService.getFromQueue(pid)){
                socketService.emit('log', {id : pid, message : data.toString(), timestamp : new Date()});
                console.log(data.toString());
                const lines : string[] = data.toString().split("\n");
                const progressLines : string[] = lines.filter((l) => progressRegex.exec(l));
                if (progressLines.length > 0){
                    const progressLine : string = progressLines.pop() as string;
                    const match = progressRegex.exec(progressLine);
                    if (match){
                        const [_, progress, size, speed, eta] = match;
                        const percentFactor = (100 - parseFloat(progress)) / 100;
                        const sizeLeft = parseFloat(size) * percentFactor;

                        const deltaDetails : Partial<DownloadDetails> = {
                            uuid,
                            progress : parseFloat(progress),
                            size : parseFloat(size),
                            speed : parseFloat(speed),
                            eta,
                            sizeLeft
                        }

                        queueService.updateQueue(pid, deltaDetails);
                    }
                }
            }
        });

        downloadProcess.on('close', async (code) => {
            if (code === 0) {
                const queueItem : QueueEntry | undefined = queueService.getFromQueue(pid);
                if (queueItem){
                    try {
                        const uuidPath = path.join(downloadDir, uuid);
                        const files = fs.readdirSync(uuidPath);
                        const mp4File = files.find(file => file.endsWith(".mp4"));

                        if (mp4File) {
                            const oldPath = path.join(uuidPath, mp4File);
                            const newPath = path.join(completeDir, `${queueItem?.nzbName}.mp4`);

                            fs.renameSync(oldPath, newPath);
                        }

                        // Delete the uuid directory after moving the file
                        fs.rmSync(uuidPath, { recursive: true, force: true });

                        await historyService.addHistory(queueItem);
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
            queueService.removeFromQueue(pid);
        });

        return downloadProcess;
    },

    filmSearch : async (inputTerm : string) : Promise<IPlayerSearchResult[]> => {
        //Sanitize the term, BBC don't put years on their movies
        const term = removeLastFourDigitNumber(inputTerm);

        const synonym = await synonymService.getSynonym(inputTerm);
        const searchTerm = synonym ? synonym.target : term;

        //If we've searched before
        let results : IPlayerSearchResult[] | undefined = searchCache.get(searchTerm);
        if (!results){
            results = await searchIPlayer(searchTerm, synonym, false);
            searchCache.set(searchTerm, results);
        }

        for (const result of results){
            result.nzbName = inputTerm.replaceAll(" ",".")+".BBC.WEB-DL.AAC.2.0.H.264";
        }

        return results;
    },

    tvSearch : async (term : string, season : number, episode : number) : Promise<IPlayerSearchResult[]> => {
        const synonym = await synonymService.getSynonym(term);
        let searchTerm = synonym ? synonym.target : term;
        
        //If we've provided an episode, find the name from sonarr
        const episodeName : string | undefined = episode ? (await sonarrService.getEpisodeTitle(term, season, episode)) : undefined;

        //If we've searched before
        let results : IPlayerSearchResult[] | undefined = searchCache.get(searchTerm);
        if (!results){
            results = await searchIPlayer(searchTerm, synonym);
            searchCache.set(searchTerm, results);
        }

        //Find the correct season and show
        results = results.filter(({title}) => {
            if (season && !title.includes(`Series ${season}`) && !title.includes(`Season ${season}`)) {
                return false;
            }
            if (episode) {
                const episodeFoundByNumber : boolean = title.includes(`Episode ${episode}`);
                const episodeFoundByName : boolean = episodeName != undefined && title.includes(episodeName);
                if (!episodeFoundByNumber && !episodeFoundByName) {
                    return false;
                }
            }
            return true;
        });

        return results;
    },

    refreshCache: async () => {
        const downloadDir = await getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;
        const completeDir = await getParameter(IplayarrParameter.COMPLETE_DIR) as string;
        const [exec, args] = await getIPlayerExec();

        //Refresh the cache
        loggingService.debug(`Executing get_iplayer with args: ${[...args].join(" ")} --cache-rebuild`);
        spawn(exec as string, [...args, '--cache-rebuild'], { shell: true });
        
        //Delete failed jobs
        const threeHoursAgo : number = Date.now() - 3 * 60 * 60 * 1000;
        fs.readdir(downloadDir, { withFileTypes: true }, (err, entries) => {
            if (err) {
                console.error('Error reading directory:', err);
                return;
            }
    
            entries.forEach(entry => {
                if (!entry.isDirectory()) return;
    
                const dirPath : string = path.join(downloadDir, entry.name);
                const filePath : string = path.join(dirPath, timestampFile);
    
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        // Ignore missing files
                        if (err.code !== 'ENOENT') console.error(`Error checking ${filePath}:`, err);
                        return;
                    }
    
                    if (stats.mtimeMs < threeHoursAgo) {
                        fs.rm(dirPath, { recursive: true, force: true }, (err) => {
                            if (err) {
                                loggingService.error(`Error deleting ${dirPath}:`, err);
                            } else {
                                loggingService.log(`Deleted old directory: ${dirPath}`);
                            }
                        });
                    }
                });
            });
        });
    },
}

async function searchIPlayer(term : string, synonym? : Synonym, tv : boolean = true) : Promise<IPlayerSearchResult[]> {
    return new Promise(async (resolve, reject) => {
        const results : IPlayerSearchResult[] = []
        const [exec, args] = await getIPlayerExec();
        const exemptionArgs : string[] = [];
        if (synonym && synonym.exemptions){
            const exemptions = synonym.exemptions.split(",");
            for (const exemption of exemptions){
                exemptionArgs.push('--exclude');
                exemptionArgs.push(`"${exemption}"`);
            }
        }
        const allArgs = [...args, ...exemptionArgs, `"${term}"`];

        loggingService.debug(`Executing get_iplayer with args: ${allArgs.join(" ")}`);
        const searchProcess = spawn(exec as string, allArgs, { shell: true });

        searchProcess.stdout.on('data', (data) => {
            loggingService.debug(data.toString().trim());
            const lines = data.toString().split("\n");
            for (const line of lines) {
                const match = episodeRegex.exec(line);
                if (match) {
                    let [_, number, title, channel, pid] = match;
                    title = title.replace(/ - -$/g, '');
                    results.push({ 
                        number : parseInt(number), title, channel, pid, request : {term, line} });
                }
            }
        });

        searchProcess.stderr.on('data', (data) => {
            loggingService.error(data.toString().trim());
        });

        searchProcess.on('close', async (code) => {
            if (code === 0) {
                for (let result of results){
                    if (tv){
                        const nzbName : string | undefined = term != "*" ? (await createNZBName(term, result.request.line || legacyCreateNZBName(result.title))) : legacyCreateNZBName(result.title);
                        result.nzbName =  nzbName;
                    } else {
                        const nzbName = term;
                        result.nzbName =  nzbName;
                    }
                }
                resolve(results);
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    })
}

async function getIPlayerExec() : Promise<(string | RegExpMatchArray)[]> {
    const fullExec : string = await getParameter(IplayarrParameter.GET_IPLAYER_EXEC) as string;
    const args : RegExpMatchArray = fullExec.match(/(?:[^\s"]+|"[^"]*")+/g) as RegExpMatchArray;

    const exec : string = args.shift() as string;

    return [exec, args];
}

function removeLastFourDigitNumber(str : string) {
    return str.replace(/\d{4}(?!.*\d{4})/, '').trim();
}

export default iplayerService;