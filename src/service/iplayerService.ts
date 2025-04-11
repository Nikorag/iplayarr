import axios, { AxiosResponse } from 'axios';
import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import NodeCache from 'node-cache';
import path from 'path';
import { deromanize } from 'romans';

import { DownloadDetails } from '../types/DownloadDetails';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../types/IPlayerSearchResult';
import { LogLine, LogLineLevel } from '../types/LogLine';
import { QueueEntry } from '../types/QueueEntry';
import { IPlayerNewSearchResponse } from '../types/responses/iplayer/IPlayerNewSearchResponse';
import { IPlayerChilrenResponse } from '../types/responses/IPlayerMetadataResponse';
import { Synonym } from '../types/Synonym';
import { createNZBName, getQualityProfile, splitArrayIntoChunks } from '../utils/Utils';
import configService from './configService';
import episodeCacheService from './episodeCacheService';
import historyService from './historyService';
import loggingService from './loggingService';
import queueService from './queueService';
import socketService from './socketService';
import synonymService from './synonymService';

const progressRegex: RegExp = /([\d.]+)% of ~?([\d.]+ [A-Z]+) @[ ]+([\d.]+ [A-Za-z]+\/s) ETA: ([\d:]+).*video\]$/;
const seriesRegex: RegExp = /: (?:Series|Season) (\d+)/
const nativeSeriesRegex : RegExp = /^(?:(?:Series|Season) )?(\d+|[MDCLXVI]+)$/

const listFormat: string = 'RESULT|:|<pid>|:|<name>|:|<seriesnum>|:|<episodenum>|:|<index>|:|<channel>|:|<duration>|:|<available>'

const searchCache: NodeCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const timestampFile = 'iplayarr_timestamp';

const iplayerService = {
    download: async (pid: string): Promise<ChildProcess> => {
        const downloadDir = await configService.getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;
        const completeDir = await configService.getParameter(IplayarrParameter.COMPLETE_DIR) as string;

        const [exec, args] = await getIPlayerExec();
        const additionalParams: string[] = await getAddDownloadParams();
        fs.mkdirSync(`${downloadDir}/${pid}`, { recursive: true });
        fs.writeFileSync(`${downloadDir}/${pid}/${timestampFile}`, '');
        const allArgs = [...args, ...additionalParams, await getQualityParam(), '--output', `${downloadDir}/${pid}`, '--overwrite', '--force', '--log-progress', `--pid=${pid}`];

        loggingService.debug(`Executing get_iplayer with args: ${allArgs.join(' ')}`);
        const downloadProcess = spawn(exec as string, allArgs);

        downloadProcess.stdout.on('data', (data) => {
            if (queueService.getFromQueue(pid)) {
                const logLine: LogLine = { level: LogLineLevel.INFO, id: pid, message: data.toString(), timestamp: new Date() }
                socketService.emit('log', logLine);
                console.log(data.toString());
                const lines: string[] = data.toString().split('\n');
                const progressLines: string[] = lines.filter((l) => progressRegex.exec(l));
                if (progressLines.length > 0) {
                    const progressLine: string = progressLines.pop() as string;
                    const match = progressRegex.exec(progressLine);
                    if (match) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const [_, progress, size, speed, eta] = match;
                        const percentFactor = (100 - parseFloat(progress)) / 100;
                        const sizeLeft = parseFloat(size) * percentFactor;

                        const deltaDetails: Partial<DownloadDetails> = {
                            uuid: pid,
                            progress: parseFloat(progress),
                            size: parseFloat(size),
                            speed: parseFloat(speed),
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
                const queueItem: QueueEntry | undefined = queueService.getFromQueue(pid);
                if (queueItem) {
                    try {
                        const uuidPath = path.join(downloadDir, pid);
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

    search: async (inputTerm: string, season?: number, episode?: number): Promise<IPlayerSearchResult[]> => {
        const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);

        //Sanitize the term, BBC don't put years on their movies
        const term = !season ? removeLastFourDigitNumber(inputTerm) : inputTerm;

        const synonym = await synonymService.getSynonym(inputTerm);
        const searchTerm = synonym ? synonym.target : term;

        //Check the cache
        let results: IPlayerSearchResult[] | undefined = searchCache.get(searchTerm);
        if (!results) {
            const method : 'nativeSearch' | 'getIplayerSearch' = (searchTerm != '*' && nativeSearchEnabled == 'true' ? 'nativeSearch' : 'getIplayerSearch') 
            results = await iplayerService[method](searchTerm, synonym);
            searchCache.set(searchTerm, results);
        }

        let returnResults: IPlayerSearchResult[] = [];
        if (season != null && episode != null) {
            returnResults = results.filter((result) => result.series == season && result.episode == episode);
        } else {
            returnResults = results;
        }

        //Get the out of schedule results form cache
        if (nativeSearchEnabled == 'false'){
            const episodeCache: IPlayerSearchResult[] = await episodeCacheService.searchEpisodeCache(inputTerm);
            for (const cachedEpisode of episodeCache) {
                if (cachedEpisode) {
                    const exists = returnResults.some(({ pid }) => pid == cachedEpisode.pid);
                    const validSeason = season ? cachedEpisode.series == season : true;
                    const validEpisode = episode ? cachedEpisode.episode == episode : true;
                    if (!exists && validSeason && validEpisode) {
                        returnResults.push({ ...cachedEpisode, pubDate: cachedEpisode.pubDate ? new Date(cachedEpisode.pubDate) : undefined });
                    }
                }
            }
        }

        return returnResults.filter(({pubDate}) => !pubDate || pubDate < new Date());
    },

    refreshCache: async () => {
        const downloadDir = await configService.getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;
        const [exec, args] = await getIPlayerExec();

        //Refresh the cache
        loggingService.debug(`Executing get_iplayer with args: ${[...args].join(' ')} --cache-rebuild`);
        const refreshService = spawn(exec as string, [...args, '--cache-rebuild'], { shell: true });

        refreshService.stdout.on('data', (data) => {
            loggingService.debug(data.toString());
        });

        refreshService.stderr.on('data', (data) => {
            loggingService.error(data.toString());
        });

        //Delete failed jobs
        const threeHoursAgo: number = Date.now() - 3 * 60 * 60 * 1000;
        fs.readdir(downloadDir, { withFileTypes: true }, (err, entries) => {
            if (err) {
                console.error('Error reading directory:', err);
                return;
            }

            entries.forEach(entry => {
                if (!entry.isDirectory()) return;

                const dirPath: string = path.join(downloadDir, entry.name);
                const filePath: string = path.join(dirPath, timestampFile);

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

    details: async (pids: string[]): Promise<IPlayerDetails[]> => {
        return await Promise.all(pids.map((pid) => iplayerService.episodeDetails(pid)));
    },

    episodeDetails: async (pid: string): Promise<IPlayerDetails> => {
        const { programme } = await episodeCacheService.getMetadata(pid);
        
        const runtime = programme.versions?.length ? (programme.versions[0].duration / 60) : 0;
        const category = programme.categories?.length ? programme.categories[0].title : '';

        // TODO: Troubleshoot https://www.bbc.co.uk/programmes/m000jbtq.json showing up as MOVIE for "chelsea"
        const belongToASeries = programme.parent?.programme.type == 'series';
        const seriesName : string | undefined = belongToASeries ? programme.parent?.programme?.title : undefined;
        // Parse the season number from the title if we can as it accounts for specials, unlike the position
        const seriesMatch = seriesName?.match(nativeSeriesRegex);
        const series = seriesMatch ? getPotentialRoman(seriesMatch[1])
            : belongToASeries ? programme.parent?.programme?.position // Fall back to the position if within a series
                : programme.parent ? 0 : undefined; // Leave blank for movies but map TV specials to season 0
        const episode = belongToASeries // Work out the episode number within the season if we don't have a position
            ? programme.position ?? (series ? programme.parent?.programme?.aggregated_episode_count : undefined)
            : programme.parent ? 0 : undefined; // Leave blank for movies but map TV specials to episode 0

        return {
            pid,
            title: programme.display_title?.title ?? programme.title,
            episode,
            episodeTitle: series != null && episode != null ? programme.title : undefined,
            series,
            channel: programme.ownership?.service?.title,
            category,
            description: programme.medium_synopsis,
            runtime,
            firstBroadcast: programme.first_broadcast_date,
            link: `https://www.bbc.co.uk/programmes/${pid}`,
            thumbnail: programme.image ? `https://ichef.bbci.co.uk/images/ic/1920x1080/${programme.image.pid}.jpg` : undefined
        }
    },

    removeFromSearchCache: (term: string) => {
        searchCache.del(term);
    },

    nativeSearch: async (term: string, synonym?: Synonym): Promise<IPlayerSearchResult[]> => {
        const { sizeFactor } = await getQualityProfile();

        const url = `https://ibl.api.bbc.co.uk/ibl/v1/new-search?q=${encodeURIComponent(synonym?.target ?? term)}`;

        const response: AxiosResponse<IPlayerNewSearchResponse> = await axios.get(url);
        if (response.status == 200) {
            const { new_search: { results } } = response.data;
            const brandPids : Set<string> = new Set();
            let infos : IPlayerDetails[] = [];

            //Only get the first result from iplayer
            //for (const { id } of results) {
            if (results.length > 0){
                const {id} = results[0];
                const brandPid = await episodeCacheService.findBrandForPid(id);
                if (brandPid) {
                    brandPids.add(brandPid);
                } else {
                    const pidInfos = await iplayerService.details([id]);
                    infos = [...infos, ...pidInfos];
                }
            }

            for (const brandPid of brandPids){
                const {data : {children : seriesList}} : {data : IPlayerChilrenResponse} = await axios.get(`https://www.bbc.co.uk/programmes/${encodeURIComponent(brandPid)}/children.json?limit=100`);
                const episodes = (await Promise.all(seriesList.programmes.filter(({ type }) => type == 'series').map(({ pid }) => episodeCacheService.getSeriesEpisodes(pid))))
                    .flat();
                episodes.push(...seriesList.programmes.filter(({ type, first_broadcast_date }) => type == 'episode' && first_broadcast_date != null).map(({ pid }) => pid));
                
                const chunks = splitArrayIntoChunks(episodes, 5);
                const chunkInfos = await chunks.reduce(async (accPromise, chunk) => {
                    const acc = await accPromise; // Ensure previous results are awaited
                    const results: IPlayerDetails[] = await iplayerService.details(chunk);
                    return [...acc, ...results];
                }, Promise.resolve([])); // Initialize accumulator as a resolved Promise

                infos = [...infos, ...chunkInfos];
            }

            const synonymName = synonym ? (synonym.filenameOverride || synonym.from).replaceAll(/[^a-zA-Z0-9\s.]/g, '').replaceAll(' ', '.') : undefined;
            return await Promise.all(infos.map((info: IPlayerDetails) => createResult(info.title, info, sizeFactor, synonymName)));
        } else {
            return [];
        }
    },

    getIplayerSearch : async(term: string, synonym?: Synonym) : Promise<IPlayerSearchResult[]> => {
        const { sizeFactor } = await getQualityProfile();
        return new Promise(async (resolve, reject) => {
            const results: IPlayerSearchResult[] = []
            const [exec, args] = await getIPlayerExec();
            const exemptionArgs: string[] = [];
            if (synonym && synonym.exemptions) {
                const exemptions = synonym.exemptions.split(',');
                for (const exemption of exemptions) {
                    exemptionArgs.push('--exclude');
                    exemptionArgs.push(`"${exemption}"`);
                }
            }
            if (term == '*') {
                const rssHours: string = (await configService.getParameter(IplayarrParameter.RSS_FEED_HOURS)) as string;
                (args as RegExpMatchArray).push('--available-since');
                (args as RegExpMatchArray).push(rssHours);
            }
            const allArgs = [...args, '--listformat', `"${listFormat}"`, ...exemptionArgs, `"${term}"`];
    
            loggingService.debug(`Executing get_iplayer with args: ${allArgs.join(' ')}`);
            const searchProcess = spawn(exec as string, allArgs, { shell: true });
    
            searchProcess.stdout.on('data', (data) => {
                loggingService.debug(data.toString().trim());
                const lines: string[] = data.toString().split('\n');
                for (const line of lines) {
                    if (line.startsWith('RESULT|:|')) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const [_, pid, rawTitle, seriesStr, episodeStr, number, channel, durationStr, onlineFrom] = line.split('|:|');
                        const episode: number | undefined = (episodeStr == '' ? undefined : parseInt(episodeStr));
                        const [title, series] = (seriesStr == '' ? [rawTitle, undefined] : extractSeriesNumber(rawTitle, seriesStr))
                        const type: VideoType = episode && series ? VideoType.TV : VideoType.MOVIE;
                        const size: number | undefined = durationStr ? parseInt(durationStr) * sizeFactor : undefined;
                        results.push({
                            pid,
                            title,
                            channel,
                            number: parseInt(number),
                            request: { term, line },
                            episode,
                            series,
                            type,
                            size,
                            pubDate: onlineFrom ? new Date(onlineFrom) : undefined
                        });
                    }
                }
            });
    
            searchProcess.stderr.on('data', (data) => {
                loggingService.error(data.toString().trim());
            });
    
            searchProcess.on('close', async (code) => {
                if (code === 0) {
                    for (const result of results) {
                        const synonymName = synonym ? (synonym.filenameOverride || synonym.from).replaceAll(/[^a-zA-Z0-9\s.]/g, '').replaceAll(' ', '.') : undefined;
    
                        const nzbName = await createNZBName(result.type, {
                            title: result.title.replaceAll(' ', '.'),
                            season: result.series != null ? result.series.toString().padStart(2, '0') : undefined,
                            episode: result.episode != null ? result.episode.toString().padStart(2, '0') : undefined,
                            synonym: synonymName
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
}

function extractSeriesNumber(title: string, series: string): any[] {
    const match = seriesRegex.exec(title);
    if (match) {
        return [title.replace(seriesRegex, ''), parseInt(match[1])];
    } else {
        return [title, parseInt(series)];
    }
}

async function getIPlayerExec(): Promise<(string | RegExpMatchArray)[]> {
    const fullExec: string = await configService.getParameter(IplayarrParameter.GET_IPLAYER_EXEC) as string;
    const args: RegExpMatchArray = fullExec.match(/(?:[^\s"]+|"[^"]*")+/g) as RegExpMatchArray;

    const exec: string = args.shift() as string;

    const cacheLocation = process.env.CACHE_LOCATION;
    if (cacheLocation) {
        args.push('--profile-dir');
        args.push(`"${cacheLocation}"`);
    }

    return [exec, args];
}

async function getQualityParam(): Promise<string> {
    const videoQuality = await configService.getParameter(IplayarrParameter.VIDEO_QUALITY) as string;

    return `--tv-quality=${videoQuality}`;
}

async function getAddDownloadParams(): Promise<string[]> {
    const additionalParams = await configService.getParameter(IplayarrParameter.ADDITIONAL_IPLAYER_DOWNLOAD_PARAMS);

    if (additionalParams) {
        return additionalParams.split(' ');
    } else {
        return [];
    }
}

function removeLastFourDigitNumber(str: string) {
    return str.replace(/\d{4}(?!.*\d{4})/, '').trim();
}

async function createResult(term: string, details: IPlayerDetails, sizeFactor: number, synonymName: string | undefined): Promise<IPlayerSearchResult> {
    const size: number | undefined = details.runtime ? (details.runtime * 60) * sizeFactor : undefined;

    const type: VideoType = details.episode != null && details.series != null ? VideoType.TV : VideoType.MOVIE;

    const nzbName = await createNZBName(type, {
        title: details.title.replaceAll(' ', '.'),
        season: details.series != null ? details.series.toString().padStart(2, '0') : undefined,
        episode: details.episode != null ? details.episode.toString().padStart(2, '0') : undefined,
        episodeTitle: details.episodeTitle?.replaceAll(' ', '.'),
        synonym: synonymName
    });

    return {
        number: 0,
        title: details.title,
        channel: details.channel || '',
        pid: details.pid,
        request: {
            term,
            line: term
        },
        episode: details.episode,
        episodeTitle: details.episodeTitle,
        pubDate: details.firstBroadcast ? new Date(details.firstBroadcast) : undefined,
        series: details.series,
        type,
        size,
        nzbName
    }
}

function getPotentialRoman(str : string) : number {
    return (() => {
        try {
            return deromanize(str);
        } catch {
            return parseInt(str);
        }
    })()
}

export default iplayerService;
