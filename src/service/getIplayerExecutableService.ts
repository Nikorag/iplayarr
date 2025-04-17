import fs from 'fs';
import path from 'path';
import { IPlayerProgramMetadata } from 'src/types/responses/IPlayerMetadataResponse';

import { listFormat, progressRegex } from '../constants/iPlayarrConstants';
import { DownloadDetails } from '../types/data/DownloadDetails';
import { IPlayerSearchResult } from '../types/data/IPlayerSearchResult';
import { LogLine, LogLineLevel } from '../types/data/LogLine';
import { IplayarrParameter } from '../types/enums/IplayarrParameters';
import { GetIPlayerExecutable } from '../types/getIplayer/GetIPlayerExecutable';
import { QueueEntry } from '../types/models/QueueEntry';
import { Synonym } from '../types/models/Synonym';
import { calculateSeasonAndEpisode, createNZBName, parseEpisodeDetailStrings } from '../utils/Utils';
import configService from './configService';
import historyService from './entity/historyService';
import loggingService from './loggingService';
import queueService from './queueService';
import socketService from './socketService';

export class GetIplayerExecutableService {
    async getIPlayerExec(): Promise<GetIPlayerExecutable> {
        const fullExec: string = await configService.getParameter(IplayarrParameter.GET_IPLAYER_EXEC) as string;
        const args: RegExpMatchArray = fullExec?.match(/(?:[^\s"]+|"[^"]*")+/g) ?? ['get_iplayer'];

        const exec: string = args.shift() as string;

        args.push('--encoding-console-out');
        args.push('UTF-8')

        const cacheLocation = process.env.CACHE_LOCATION;
        if (cacheLocation) {
            args.push('--profile-dir');
            args.push(`"${cacheLocation}"`);
        }

        return {
            exec,
            args
        }
    }

    async #getQualityParam(): Promise<string> {
        const videoQuality = await configService.getParameter(IplayarrParameter.VIDEO_QUALITY) as string;
        return `--tv-quality=${videoQuality}`;
    }

    async getAllDownloadParameters(pid: string): Promise<GetIPlayerExecutable> {
        const downloadDir: string = await configService.getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;

        const { exec, args } = await this.getIPlayerExec();
        const additionalParamsString: string = await configService.getParameter(IplayarrParameter.ADDITIONAL_IPLAYER_DOWNLOAD_PARAMS) as string;
        const additionalParams: string[] = additionalParamsString ? additionalParamsString.split(' ') : [];

        const allArgs: string[] = [...args, ...additionalParams, await this.#getQualityParam(), '--output', `${downloadDir}/${pid}`, '--overwrite', '--force', '--log-progress', `--pid=${pid}`];

        return {
            exec,
            args: allArgs
        }
    }

    async getSearchParameters(term: string, synonym?: Synonym) {
        const { exec, args } = await this.getIPlayerExec();
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

        return {
            exec,
            args: allArgs
        }
    }

    logProgress(pid: string, data : any) {
        console.log(data.toString());
        const logLine: LogLine = { level: LogLineLevel.INFO, id: pid, message: data.toString(), timestamp: new Date() }
        socketService.emit('log', logLine);
    }

    parseProgress(pid: string, data: any): DownloadDetails | undefined {
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

                return deltaDetails;
            }
        }
        return;
    }

    async processCompletedDownload(pid: string, code: number | null): Promise<void> {
        const [downloadDir, completeDir] = await configService.getParameters(IplayarrParameter.DOWNLOAD_DIR, IplayarrParameter.COMPLETE_DIR) as string[];
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
    }

    parseResults(term: string, data: any, sizeFactor: number): IPlayerSearchResult[] {
        const results: IPlayerSearchResult[] = [];
        const lines: string[] = data.toString().split('\n');
        for (const line of lines) {
            if (line.startsWith('RESULT|:|')) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [_, pid, rawTitle, seriesStr, episodeStr, number, channel, durationStr, onlineFrom, epTitle] = line.split('|:|');
                const [ title, episodeNum, seriesNum ] = parseEpisodeDetailStrings(rawTitle, episodeStr, seriesStr)
                const [ type, episode, episodeTitle, series ] = calculateSeasonAndEpisode({
                    type: 'episode',
                    pid,
                    title: episodeNum != null || epTitle != '' ? epTitle : title,
                    position: episodeNum,
                    display_title: {
                        title,
                        subtitle: epTitle,
                    },
                    parent: episodeNum != null || epTitle != '' ? {
                        programme: {
                            type: 'series',
                            position: seriesNum
                        }
                    } : undefined
                } as IPlayerProgramMetadata);
                results.push({
                    pid,
                    title,
                    channel,
                    number: parseInt(number),
                    request: { term, line },
                    episode,
                    series,
                    type,
                    size: durationStr ? parseInt(durationStr) * sizeFactor : undefined,
                    pubDate: onlineFrom ? new Date(onlineFrom) : undefined,
                    episodeTitle
                });
            }
        }
        return results;
    }

    async processCompletedSearch(results : IPlayerSearchResult[], synonym? : Synonym) : Promise<IPlayerSearchResult[]> {
        for (const result of results) {
            result.nzbName = await createNZBName(result, synonym);
        }
        return results;
    }
}

export default new GetIplayerExecutableService();