import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import NodeCache from 'node-cache';
import path from 'path';
import { v4 } from 'uuid';

import { DownloadDetails } from '../types/DownloadDetails';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../types/IPlayerSearchResult';
import { LogLine, LogLineLevel } from '../types/LogLine';
import { QueueEntry } from '../types/QueueEntry';
import { Synonym } from '../types/Synonym';
import { createNZBName, getQualityPofile } from '../utils/Utils';
import configService from './configService';
import episodeCacheService from './episodeCacheService';
import historyService from './historyService';
import loggingService from './loggingService';
import queueService from './queueService';
import socketService from './socketService';
import synonymService from './synonymService';

const progressRegex : RegExp = /([\d.]+)% of ~?([\d.]+ [A-Z]+) @[ ]+([\d.]+ [A-Za-z]+\/s) ETA: ([\d:]+).*video\]$/;
const seriesRegex : RegExp = /: (?:Series|Season) (\d+)/
const detailsRegex : RegExp = /^([a-z+]+): +(.*)$/;
const processingRegex : RegExp = /INFO: Processing (?:.*)\(([0-9a-z]+)\)'$/;

const listFormat : string = 'RESULT|:|<pid>|:|<name>|:|<seriesnum>|:|<episodenum>|:|<index>|:|<channel>|:|<duration>|:|<available>'

const searchCache : NodeCache = new NodeCache({stdTTL: 300, checkperiod: 60});
const detailsCache : NodeCache = new NodeCache({stdTTL: 86400, checkperiod: 3600});

const timestampFile = 'iplayarr_timestamp';

const iplayerService = {
    download : async (pid : string) : Promise<ChildProcess> => {
        const uuid : string = v4();
        const downloadDir = await configService.getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;
        const completeDir = await configService.getParameter(IplayarrParameter.COMPLETE_DIR) as string;

        const [exec, args] = await getIPlayerExec();
        const additionalParams : string[] = await getAddDownloadParams();
        fs.mkdirSync(`${downloadDir}/${uuid}`);
        fs.writeFileSync(`${downloadDir}/${uuid}/${timestampFile}`, '');
        const allArgs = [...args, ...additionalParams, await getQualityParam(), '--output', `${downloadDir}/${uuid}`, '--overwrite', '--force', '--log-progress', `--pid=${pid}`];

        loggingService.debug(`Executing get_iplayer with args: ${allArgs.join(' ')}`);
        const downloadProcess = spawn(exec as string, allArgs);

        downloadProcess.stdout.on('data', (data) => {
            if (queueService.getFromQueue(pid)){
                const logLine : LogLine = {level : LogLineLevel.INFO, id : pid, message : data.toString(), timestamp : new Date()}
                socketService.emit('log', logLine);
                console.log(data.toString());
                const lines : string[] = data.toString().split('\n');
                const progressLines : string[] = lines.filter((l) => progressRegex.exec(l));
                if (progressLines.length > 0){
                    const progressLine : string = progressLines.pop() as string;
                    const match = progressRegex.exec(progressLine);
                    if (match){
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                        loggingService.debug(pid, `Looking for MP4 files in ${uuidPath}`);
                        const files = fs.readdirSync(uuidPath);
                        const mp4File = files.find(file => file.endsWith('.mp4'));

                        if (mp4File) {
                            const oldPath = path.join(uuidPath, mp4File);
                            loggingService.debug(pid, `Found MP4 file ${oldPath}`);
                            const newPath = path.join(completeDir, `${queueItem?.nzbName}.mp4`);
                            loggingService.debug(pid, `Moving ${oldPath} to ${newPath}`);

                            fs.copyFileSync(oldPath, newPath);
                        }

                        // Delete the uuid directory and file after moving it
                        loggingService.debug(pid, `Deleting old directory ${uuidPath}`);
                        fs.rmSync(uuidPath, { recursive: true, force: true });

                        await historyService.addHistory(queueItem);
                    } catch (err) {
                        loggingService.error(err);
                    }
                }
            }
            queueService.removeFromQueue(pid);
        });

        return downloadProcess;
    },

    search : async (inputTerm : string, season? : number, episode? : number) : Promise<IPlayerSearchResult[]> => {
        //Sanitize the term, BBC don't put years on their movies
        const term = !season ? removeLastFourDigitNumber(inputTerm) : inputTerm;

        const synonym = await synonymService.getSynonym(inputTerm);
        const searchTerm = synonym ? synonym.target : term;

        //Check the cache
        let results : IPlayerSearchResult[] | undefined = searchCache.get(searchTerm);
        if (!results){
            results = await searchIPlayer(searchTerm, synonym);
            searchCache.set(searchTerm, results);
        }

        let returnResults : IPlayerSearchResult[] = [];
        if (season && episode){
            returnResults = results.filter((result) => result.series == season && result.episode == episode);
        } else {
            returnResults = results;
        }

        //Get the out of schedule results form cache
        const episodeCache : IPlayerSearchResult[] = await episodeCacheService.getEpisodeCache(inputTerm.toLowerCase());
        for (const episode of episodeCache){
            const exists = returnResults.some(({pid}) => pid == episode.pid);
            if (!exists){
                returnResults.push(episode);
            }
        }

        return returnResults;
    },

    refreshCache: async () => {
        const downloadDir = await configService.getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;
        const [exec, args] = await getIPlayerExec();

        //Refresh the cache
        loggingService.debug(`Executing get_iplayer with args: ${[...args].join(' ')} --cache-rebuild`);
        const refreshService = spawn(exec as string, [...args, '--cache-rebuild'], { shell: true });

        refreshService.stdout.on('data', (data) => {
            loggingService.log(data.toString());
        });

        refreshService.stderr.on('data', (data) => {
            loggingService.error(data.toString());
        });
        
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

    details : async (pids : string[]) : Promise<IPlayerDetails[]> => {
        return new Promise(async (resolve) => {
            const details : IPlayerDetails[] = [];
            const toSearch : string[] = [];
            for (const pid of pids){
                const cachedDetail : IPlayerDetails | undefined = detailsCache.get(pid);
                if (cachedDetail){
                    details.push(cachedDetail);
                } else {
                    toSearch.push(pid);
                }
            }

            let detailMap : {[key : string] : string} = {};
            let processingPid : string = '';
            const [exec, args] = await getIPlayerExec();
            const allArgs = [...args, '-i', `--pid="${pids.join(',')}"`];

            loggingService.debug(`Executing get_iplayer with args: ${allArgs.join(' ')}`);
            const detailsProcess = spawn(exec as string, allArgs, { shell: true });

            detailsProcess.stdout.on('data', (data) => {
                loggingService.debug(data.toString());
                const lines : string[] = data.toString().split('\n');
                for (const line of lines){
                    const processingMatch = processingRegex.exec(line);
                    if (processingMatch){
                        if (processingPid != '' && Object.keys(detailMap).length > 0){
                            const detail : IPlayerDetails = createDetailsObject(detailMap);
                            details.push(detail);
                            detailsCache.set(processingPid, detail);
                            detailMap = {};
                        }
                        processingPid = processingMatch[1]
                    }
                    const match = detailsRegex.exec(line);
                    if (match){
                        const key = match[1];
                        const value = match[2];
                        detailMap[key] = value;
                    }
                }
            });

            detailsProcess.on('close', () => {
                if (processingPid != '' && Object.keys(detailMap).length > 0){
                    const detail : IPlayerDetails = createDetailsObject(detailMap);
                    details.push(detail);
                    detailsCache.set(processingPid, detail);
                }
                resolve(details);
            })
        });
    }
}

async function searchIPlayer(term : string, synonym? : Synonym) : Promise<IPlayerSearchResult[]> {
    const {sizeFactor} = await getQualityPofile();
    return new Promise(async (resolve, reject) => {
        const results : IPlayerSearchResult[] = []
        const [exec, args] = await getIPlayerExec();
        const exemptionArgs : string[] = [];
        if (synonym && synonym.exemptions){
            const exemptions = synonym.exemptions.split(',');
            for (const exemption of exemptions){
                exemptionArgs.push('--exclude');
                exemptionArgs.push(`"${exemption}"`);
            }
        }
        const allArgs = [...args, '--listformat', `"${listFormat}"`, ...exemptionArgs, `"${term}"`];

        loggingService.debug(`Executing get_iplayer with args: ${allArgs.join(' ')}`);
        const searchProcess = spawn(exec as string, allArgs, { shell: true });

        searchProcess.stdout.on('data', (data) => {
            loggingService.log(data.toString().trim());
            const lines : string[] = data.toString().split('\n');
            for (const line of lines){
                if (line.startsWith('RESULT|:|')){
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [_, pid, rawTitle, seriesStr, episodeStr, number, channel, durationStr, onlineFrom] = line.split('|:|');
                    const episode : number | undefined = (episodeStr == '' ? undefined : parseInt(episodeStr));
                    const [title, series] = (seriesStr == '' ? [rawTitle, undefined] : extractSeriesNumber(rawTitle, seriesStr))
                    const type : VideoType = episode && series ? VideoType.TV : VideoType.MOVIE;
		            const size : number | undefined = durationStr ? parseInt(durationStr) * sizeFactor : undefined;
                    results.push({
                        pid,
                        title,
                        channel,
                        number: parseInt(number),
                        request: {term, line},
                        episode,
                        series,
                        type,
			size,
			pubDate : onlineFrom ? new Date(onlineFrom) : undefined
                    });
                }
            }
        });

        searchProcess.stderr.on('data', (data) => {
            loggingService.error(data.toString().trim());
        });

        searchProcess.on('close', async (code) => {
            if (code === 0) {
                for (const result of results){
                    const nzbName = await createNZBName(result.type, {
                        title: result.title.replaceAll(' ', '.'),
                        season: result.series ? result.series.toString().padStart(2, '0') : undefined,
                        episode: result.episode ? result.episode.toString().padStart(2, '0') : undefined,
                    });
                    result.nzbName = nzbName;
                }
                resolve(results);
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
}

function createDetailsObject(detailMap : {[key:string] : string}) : IPlayerDetails {
    return {
        pid: detailMap['pid'],
        title: detailMap['nameshort'] || detailMap['name'],
        channel : detailMap['channel'],
        category : detailMap['category'],
        description : detailMap['desc'],
        runtime : detailMap['runtime'] ? parseInt(detailMap['runtime']) : undefined,
        firstBroadcast : detailMap['firstbcastdate'],
        link : detailMap['player'],
        thumbnail : detailMap['thumbnail'],
        series : detailMap['seriesnum'] ? parseInt(detailMap['seriesnum']) : undefined,
        episode : detailMap['episodenum'] ? parseInt(detailMap['episodenum']) : undefined,
    }
}

function extractSeriesNumber(title : string, series : string) : any[]{
    const match = seriesRegex.exec(title);
    if (match){
        return [title.replace(seriesRegex, ''), parseInt(match[1])];
    } else {
        return [title, parseInt(series)];
    }
}

async function getIPlayerExec() : Promise<(string | RegExpMatchArray)[]> {
    const fullExec : string = await configService.getParameter(IplayarrParameter.GET_IPLAYER_EXEC) as string;
    const args : RegExpMatchArray = fullExec.match(/(?:[^\s"]+|"[^"]*")+/g) as RegExpMatchArray;

    const exec : string = args.shift() as string;

    return [exec, args];
}

async function getQualityParam() : Promise<string> {
    const videoQuality = await configService.getParameter(IplayarrParameter.VIDEO_QUALITY) as string;

    return `--tv-quality=${videoQuality}`;
}

async function getAddDownloadParams() : Promise<string[]> {
    const additionalParams = await configService.getParameter(IplayarrParameter.ADDITIONAL_IPLAYER_DOWNLOAD_PARAMS);

    if (additionalParams){
        return additionalParams.split(' ');
    } else {
        return [];
    }
}

function removeLastFourDigitNumber(str : string) {
    return str.replace(/\d{4}(?!.*\d{4})/, '').trim();
}

export default iplayerService;
