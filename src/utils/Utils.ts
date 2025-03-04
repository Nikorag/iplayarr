import sonarrService from "../service/sonarrService";
import { Request } from "express";

const seasonRegex = /(?:Series|Season)\s(\d+)/;
const episodeRegex = /(?:Episode|Ep)\s(\d+)/;

export function formatBytes(bytes: number, unit: boolean = true, decimals: number = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k: number = 1024;
    const sizes: string[] = ["Bytes", "KB", "MB", "G", "TB", "PB"];
    const i: number = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + (unit ? " " + sizes[i] : '');
}

export async function createNZBName(title: string, line: string) : Promise<string | undefined> {
    let season: number | undefined = undefined;
    let episode: number | undefined = undefined;
    const seasonMatch = seasonRegex.exec(line);
    const episodeMatch = episodeRegex.exec(line);
    if (seasonMatch) {
        season = parseInt(seasonMatch[1]);
    } else {
        return;
    }
    if (episodeMatch) {
        episode = parseInt(episodeMatch[1]);
    } else {
        episode = await sonarrService.getEpisodeFromTitle(title, season, line);
    }

    if (season && episode) {
        return `${title.replaceAll(" ", ".")}.S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}.WEB.H264-BBC`;
    }
}

export function legacyCreateNZBName(input: string) : string {
    let filename = input.replaceAll("_", ".");
    filename = filename.replaceAll(" ", ".");
    filename = filename.replaceAll(":", "");
    filename = formatInlineDates(filename);
    filename = formatSeriesString(filename);
    return `${filename}.WEB.H264-BBC`;
}

export function formatInlineDates(str: string) : string {
    return str.replace(/\b(\d{2})-(\d{2})-(\d{4})\b/g, (_, day, month, year) => `${year}-${month}-${day}`);
}

export function formatSeriesString(input: string) : string {
    return input.replace(/Series\.(\d+)\.-(?:\.\d+\.?)?\.Episode\.(\d+)/, (match, season, episode) => {
        return `S${season.padStart(2, '0')}E${episode.padStart(2, '0')}`;
    });
}

export function getBaseUrl(req: Request) : string {
    return `${req.protocol}://${req.hostname}:${req.socket.localPort}`;
};