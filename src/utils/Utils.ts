import * as crypto from 'crypto';
import { Request } from 'express';
import Handlebars from 'handlebars';
import { deromanize } from 'romans';
import { IPlayerDetails } from 'src/types/data/IPlayerDetails';
import { Synonym } from 'src/types/models/Synonym';
import { IPlayerProgramMetadata } from 'src/types/responses/IPlayerMetadataResponse';

import { episodeRegex, getIplayerSeriesRegex, nativeSeriesRegex } from '../constants/iPlayarrConstants';
import { QualityProfile, qualityProfiles } from '../constants/QualityProfiles';
import configService from '../service/configService';
import { IPlayerSearchResult, VideoType } from '../types/data/IPlayerSearchResult';
import { IplayarrParameter } from '../types/enums/IplayarrParameters';
import { FilenameTemplateContext } from '../types/templateContext/FilenameTemplateContext';

const removeUnsafeCharsRegex = /[^a-zA-Z0-9\s\\/._-]/g;

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
        title: result.title.trim().replaceAll(removeUnsafeCharsRegex, ''),
        season: result.series != null && result.episode != null
            ? result.series.toString().padStart(2, '0')
            : result.type == VideoType.TV ? '00' : undefined,
        episode: result.series != null && result.episode != null
            ? result.episode.toString().padStart(2, '0')
            : result.type == VideoType.TV ? '00' : undefined,
        episodeTitle: result.episodeTitle?.trim().replaceAll(removeUnsafeCharsRegex, ''),
        synonym: (synonym?.filenameOverride ?? synonym?.from)?.trim().replaceAll(removeUnsafeCharsRegex, ''),
        quality: qualityProfile.quality
    } as FilenameTemplateContext).replaceAll(/[\s/]|[\s\\-_]{2,}/g, '.').replaceAll(/\.{2,}/g, '.');
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

export function removeLastFourDigitNumber(str: string) {
    return str.replace(/\d{4}(?!.*\d{4})/, '').trim();
}

export function parseEpisodeDetailStrings(title: string, episode?: string, series?: string): [title: string, episode?: number, series?: number] {
    const episodeNum = parseInt(episode ?? '')
    const seriesMatch = getIplayerSeriesRegex.exec(title);
    const seriesNum = parseInt(seriesMatch ? seriesMatch[1] : series ?? '')
    return [title.replace(getIplayerSeriesRegex, '').split(': ')[0], isNaN(episodeNum) ? undefined : episodeNum, isNaN(seriesNum) ? undefined : seriesNum];
}

export function getPotentialRoman(str: string): number {
    return (() => {
        try {
            return deromanize(str);
        } catch {
            return parseInt(str);
        }
    })()
}

export function calculateSeasonAndEpisode(programme: IPlayerProgramMetadata) : [ type: VideoType, episode?: number, episodeTitle?: string, series?: number ] {
    const parent = programme.parent?.programme;

    // Determine series number from the title, falling back to position values within JSON if unsuccessful
    const nativeSeriesMatch = parent?.title?.match(nativeSeriesRegex);
    const estimatedSeries = nativeSeriesMatch
        ? getPotentialRoman(nativeSeriesMatch[1])
        : (parent?.type == 'series' ? parent?.position ?? 0 : (parent ? 0 : undefined));
    const notSpecialOrMovie = (estimatedSeries ?? 0) > 0;
    const series = parent?.expected_child_count != null && (parent.aggregated_episode_count ?? 0) > parent.expected_child_count ? 0 : estimatedSeries;

    // Determine episode from title, falling back to positions and counts if unsuccessful and not a special
    const episodeMatch = programme.title?.match(episodeRegex);
    const episode = episodeMatch
        ? parseInt(episodeMatch[1])
        : (notSpecialOrMovie ? programme.position ?? 0 : (parent ? 0 : undefined));

    // Determine episode title if not a movie
    const episodeTitle = episode != null
        ? (notSpecialOrMovie ? programme.title : programme.display_title?.subtitle)
        : undefined;

    const type = series != null && episode != null ? VideoType.TV : VideoType.MOVIE;
    return [ type, episode, episodeTitle, series ];
}