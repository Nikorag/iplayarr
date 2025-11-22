import * as crypto from 'crypto';
import { Request } from 'express';
import Handlebars from 'handlebars';
import { deromanize } from 'romans';

import { episodeRegex, getIplayerSeriesRegex, nativeSeriesRegex } from '../constants/iPlayarrConstants';
import appService from '../service/appService';
import configService from '../service/configService';
import SkyhookService from '../service/skyhook/SkyhookService';
import { FilenameTemplateContext } from '../types/FilenameTemplateContext';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerSearchResult, VideoType } from '../types/IPlayerSearchResult';
import { QualityProfile, qualityProfiles } from '../types/QualityProfiles';
import { IPlayerProgramMetadata } from '../types/responses/IPlayerMetadataResponse';
import { Synonym } from '../types/Synonym';

const removeUnsafeCharsRegex = /[^a-zA-Z0-9\s\\/._-]/g;

export async function createNZBName(result: IPlayerSearchResult | IPlayerDetails, synonym?: Synonym) {
    const templateKey: IplayarrParameter =
        result.type == VideoType.MOVIE
            ? IplayarrParameter.MOVIE_FILENAME_TEMPLATE
            : IplayarrParameter.TV_FILENAME_TEMPLATE;
    const template = (await configService.getParameter(templateKey)) as string;
    const qualityProfile = await getQualityProfile();
    return Handlebars.compile(template)({
        title: result.title.trim().replaceAll(removeUnsafeCharsRegex, ''),
        season:
            result.series != null && result.episode != null
                ? result.series.toString().padStart(2, '0')
                : result.type == VideoType.TV
                  ? '00'
                  : undefined,
        episode:
            result.series != null && result.episode != null
                ? result.episode.toString().padStart(2, '0')
                : result.type == VideoType.TV
                  ? '00'
                  : undefined,
        episodeTitle: result.episodeTitle?.trim().replaceAll(removeUnsafeCharsRegex, ''),
        synonym: (synonym?.filenameOverride ?? synonym?.from)?.trim().replaceAll(removeUnsafeCharsRegex, ''),
        quality: qualityProfile.quality,
    } as FilenameTemplateContext)
        .replaceAll(/[\s/]|[\s\\-_]{2,}/g, '.')
        .replaceAll(/\.{2,}/g, '.');
}

export function getBaseUrl(req: Request): string {
    return `${req.protocol}://${req.hostname}:${req.socket.localPort}`;
}

export function md5(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
}

export async function createNZBDownloadLink(
    req: Request,
    { pid, nzbName, type }: IPlayerSearchResult,
    apiKey: string,
    app?: string
): Promise<string> {
    let baseUrl: string = getBaseUrl(req);
    if (app) {
        const appObj = await appService.getApp(app);
        if (appObj) {
            baseUrl = `${appObj.iplayarr.useSSL ? 'https' : 'http'}://${appObj.iplayarr.host}:${appObj.iplayarr.port}`;
        }
    }
    return `${baseUrl}/api?mode=nzb-download&pid=${pid}&nzbName=${nzbName}&type=${type}&apikey=${apiKey}${app ? `&app=${app}` : ''}`;
}

export async function getQualityProfile(): Promise<QualityProfile> {
    const videoQuality = (await configService.getParameter(IplayarrParameter.VIDEO_QUALITY)) as string;
    const profile = qualityProfiles.find(({ id }) => id == videoQuality) as QualityProfile;
    return profile ? profile : qualityProfiles.find(({ quality }) => quality === 'hd') as QualityProfile;
}

export function removeAllQueryParams(str: string): string {
    const url = new URL(str);
    url.search = '';
    return url.toString();
}

export function splitArrayIntoChunks(arr: any[], chunkSize: number): any[][] {
    const chunks: any[] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
}

export function removeLastFourDigitNumber(str: string) {
    return str.replace(/\d{4}(?!.*\d{4})/, '').trim();
}

export function parseEpisodeDetailStrings(
    title: string,
    episode?: string,
    series?: string
): [title: string, episode?: number, series?: number] {
    const episodeNum = parseInt(episode ?? '');
    const seriesMatch = getIplayerSeriesRegex.exec(title);
    const seriesNum = parseInt(seriesMatch ? seriesMatch[1] : (series ?? ''));
    return [
        title.replace(getIplayerSeriesRegex, ''),
        isNaN(episodeNum) ? undefined : episodeNum,
        isNaN(seriesNum) ? undefined : seriesNum,
    ];
}

export function getPotentialRoman(str: string): number {
    return (() => {
        try {
            return deromanize(str);
        } catch {
            return parseInt(str);
        }
    })();
}

export async function calculateSeasonAndEpisode(
    programme: IPlayerProgramMetadata
): Promise<[type: VideoType, episode?: number, episodeTitle?: string, series?: number]> {
    const parent = programme.parent?.programme;

    // Determine series from title or parent position
    const nativeSeriesMatch = parent?.title?.match(nativeSeriesRegex);
    const estimatedSeries = nativeSeriesMatch
        ? getPotentialRoman(nativeSeriesMatch[1])
        : parent?.type == 'series'
            ? parent.position ?? 0
            : parent ? 0 : undefined;

    // Check if this is a special episode
    const isSpecial =
        programme.position == null ||
        (parent?.expected_child_count != null && programme.position > parent.expected_child_count);

    // Override series to 0 if counts indicate specials container
    let series =
        parent?.expected_child_count != null &&
            (parent.aggregated_episode_count ?? 0) > parent.expected_child_count &&
            isSpecial
            ? 0
            : estimatedSeries;

    // Determine episode number
    const episodeMatch = programme.title?.match(episodeRegex);
    let episode = episodeMatch
        ? parseInt(episodeMatch[1])
        : !isSpecial && (estimatedSeries ?? 0) > 0
            ? programme.position ?? 0
            : parent ? 0 : undefined;

    // Determine episode title - use subtitle for specials in container series
    const episodeTitle =
        episode != null
            ? isSpecial && parent?.position == null
                ? programme.display_title?.subtitle
                : programme.title
            : undefined;

    // Lookup specials/unresolved episodes via Skyhook
    if ((isSpecial || series === 0) && episode === 0 && episodeTitle) {
        const seriesTitle = programme.display_title?.title ?? programme.title;
        const skyhookResult = await SkyhookService.lookupSeriesDetails(seriesTitle, episodeTitle);
        if (skyhookResult) {
            series = skyhookResult.series ?? series;
            episode = skyhookResult.episode ?? episode;
        }
    }

    const type = series != null && episode != null ? VideoType.TV : VideoType.MOVIE;
    return [type, episode, episodeTitle, series];
}

export function convertToMB(size: string): number {
    const regex = /(\d+(\.\d+)?)\s*(KB|MB|GB|GiB|KiB|MiB)/i;
    const match = size.match(regex);

    if (!match) {
        return 0;
    }

    const value = parseFloat(match[1]);
    const unit = match[3].toUpperCase();

    switch (unit) {
        case 'MB':
            return Number(value.toFixed(2)); // Already in MB
        case 'GB':
            return Number((value * 1024).toFixed(2)); // 1 GB = 1024 MB
        case 'GIB':
            return Number((value * 1024).toFixed(2)); // 1 GiB = 1024 MB
        case 'KB':
            return Number((value / 1024).toFixed(2)); // 1 KB = 1/1024 MB
        case 'KIB':
            return Number((value / 1024).toFixed(2)); // 1 KiB = 1/1024 MB
        case 'MIB':
            return Number(value.toFixed(2)); // Already in MB (since MiB and MB are equivalent for practical purposes)
        default:
            return 0;
    }
}

export function getETA(eta: string | undefined, size: number, speed: number, percent: number = 0): string {
    if (eta) return eta;
    if (speed <= 0) {
        return '';
    }

    const remainingSize = size * (1 - (percent / 100))
    const totalSeconds = remainingSize / speed;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
