import * as crypto from 'crypto';
import { Request } from 'express';
import Handlebars from 'handlebars';

import configService from '../service/configService';
import { QualityProfile, qualityProfiles } from '../types/constants/QualityProfiles';
import { IPlayerSearchResult, VideoType } from '../types/data/IPlayerSearchResult';
import { IplayarrParameter } from '../types/enums/IplayarrParameters';
import { FilenameTemplateContext } from '../types/templateContext/FilenameTemplateContext';

export function formatBytes(bytes: number, unit: boolean = true, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k: number = 1024;
    const sizes: string[] = ['Bytes', 'KB', 'MB', 'G', 'TB', 'PB'];
    const i: number = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + (unit ? ' ' + sizes[i] : '');
}

export async function createNZBName(type: VideoType, context: FilenameTemplateContext) {
    context.quality = (await getQualityProfile()).quality;
    const templateKey: IplayarrParameter = type == VideoType.MOVIE ? IplayarrParameter.MOVIE_FILENAME_TEMPLATE : IplayarrParameter.TV_FILENAME_TEMPLATE;
    const template = await configService.getItem(templateKey) as string;
    return Handlebars.compile(template)(context);
}

export function getBaseUrl(req: Request): string {
    return `${req.protocol}://${req.hostname}:${req.socket.localPort}`;
};

export function md5(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
}

export function createNZBDownloadLink({ pid, nzbName, type }: IPlayerSearchResult, apiKey: string, app? : string): string {
    return `/api?mode=nzb-download&pid=${pid}&nzbName=${nzbName}&type=${type}&apikey=${apiKey}${app ? `&app=${app}` : ''}`
}

export async function getQualityProfile(): Promise<QualityProfile> {
    const videoQuality = await configService.getItem(IplayarrParameter.VIDEO_QUALITY) as string;
    return qualityProfiles.find(({ id }) => id == videoQuality) as QualityProfile;
}

export function removeAllQueryParams(str: string): string {
    const url = new URL(str);
    url.search = '';
    return url.toString();
}

export function splitArrayIntoChunks(arr: any[], chunkSize: number) {
    const chunks: any[] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
} 