import sonarrService from "../service/sonarrService";
import { Request } from "express";
import * as crypto from 'crypto';
import { getParameter } from "../service/configService";
import { IplayarrParameter } from "../types/IplayarrParameters";
import Handlebars from 'handlebars';
import { FilenameTemplateContext } from "../types/FilenameTemplateContext";
import { IPlayerSearchResult, VideoType } from "../types/IPlayerSearchResult";

const seasonRegex = /(?:Series|Season)\s(\d+)/;
const episodeRegex = /(?:Episode|Ep)\s(\d+)/;

export function formatBytes(bytes: number, unit: boolean = true, decimals: number = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k: number = 1024;
    const sizes: string[] = ["Bytes", "KB", "MB", "G", "TB", "PB"];
    const i: number = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + (unit ? " " + sizes[i] : '');
}

export async function createNZBName(type : VideoType, context : FilenameTemplateContext){
    const templateKey : IplayarrParameter = type == VideoType.MOVIE ? IplayarrParameter.MOVIE_FILENAME_TEMPLATE : IplayarrParameter.TV_FILENAME_TEMPLATE;
    const template = await getParameter(templateKey) as string;
    return Handlebars.compile(template)(context);
}

export function getBaseUrl(req: Request) : string {
    return `${req.protocol}://${req.hostname}:${req.socket.localPort}`;
};

export function md5(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
}

export function createNZBDownloadLink({pid, nzbName, type} : IPlayerSearchResult, apiKey : string) : string {
    return `/api?mode=nzb-download&pid=${pid}&nzbName=${nzbName}&type=${type}&apikey=${apiKey}`
}