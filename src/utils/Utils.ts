import * as crypto from 'crypto';
import { Request } from 'express';
import Handlebars from 'handlebars';
import { IPlayerDetails } from 'src/types/IPlayerDetails';
import { Synonym } from 'src/types/Synonym';

import configService from '../service/configService';
import { FilenameTemplateContext } from '../types/FilenameTemplateContext';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerSearchResult, VideoType } from '../types/IPlayerSearchResult';
import { QualityProfile, qualityProfiles } from '../types/QualityProfiles';

const removeUnsafeCharsRegex = /[^a-zA-Z0-9\s\\._-]/g;

export function formatBytes(bytes: number, unit: boolean = true, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k: number = 1024;
    const sizes: string[] = ['Bytes', 'KB', 'MB', 'G', 'TB', 'PB'];
    const i: number = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + (unit ? ' ' + sizes[i] : '');
}

export async function createNZBName(result: IPlayerSearchResult | IPlayerDetails, synonym?: Synonym) {
    const templateKey: IplayarrParameter = result.type == VideoType.MOVIE ? IplayarrParameter.MOVIE_FILENAME_TEMPLATE : IplayarrParameter.TV_FILENAME_TEMPLATE;
    const template = await configService.getParameter(templateKey) as string;
    const qualityProfile = await getQualityProfile();
    return Handlebars.compile(template)({
        title: result.title.replaceAll(removeUnsafeCharsRegex, ''),
        season: result.series != null ? result.series.toString().padStart(2, '0') : undefined,
        episode: result.episode != null ? result.episode.toString().padStart(2, '0') : undefined,
        episodeTitle: result.episodeTitle?.replaceAll(removeUnsafeCharsRegex, ''),
        synonym: (synonym?.filenameOverride ?? synonym?.from)?.replaceAll(removeUnsafeCharsRegex, ''),
        quality: qualityProfile.quality
    } as FilenameTemplateContext).replaceAll(/\s|[\s\\.\-_]{2,}/g, '.');
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
    const videoQuality = await configService.getParameter(IplayarrParameter.VIDEO_QUALITY) as string;
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