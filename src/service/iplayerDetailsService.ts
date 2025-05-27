import axios, { AxiosResponse } from 'axios';

import { pidRegex, searchResultLimit } from '../constants/iPlayarrConstants';
import { IPlayerDetails } from '../types/IPlayerDetails';
import { IPlayerEpisodeMetadata, IPlayerEpisodesResponse, IPlayerMetadataResponse } from '../types/responses/IPlayerMetadataResponse';
import { calculateSeasonAndEpisode } from '../utils/Utils';

class IPlayerDetailsService {
    async detailsForEpisodeMetadata(episodes: IPlayerEpisodeMetadata[]): Promise<IPlayerDetails[]> {
        const results = await Promise.allSettled(
            episodes.map(async (episode) => {
                const details = await this.episodeDetails(episode.id);
                details.firstBroadcast = episode.release_date_time;
                return details;
            })
        );

        return results
            .filter(result => result.status === 'fulfilled')
            .map((result: PromiseFulfilledResult<IPlayerDetails>) => result.value);
    }

    async details(pids: string[]): Promise<IPlayerDetails[]> {
        const results = await Promise.allSettled(
            pids.map(pid => this.episodeDetails(pid))
        );

        return results
            .filter(result => result.status === 'fulfilled')
            .map((result: PromiseFulfilledResult<IPlayerDetails>) => result.value);
    }

    async episodeDetails(pid: string): Promise<IPlayerDetails> {
        const { programme } = await this.getMetadata(pid);
        const [type, episode, episodeTitle, series] = calculateSeasonAndEpisode(programme);
        return {
            pid,
            title: programme.display_title?.title ?? programme.title,
            episode,
            episodeTitle,
            series,
            channel: programme.ownership?.service?.title,
            category: programme.categories?.length ? programme.categories[0].title : '',
            description: programme.medium_synopsis,
            runtime: programme.versions?.length ? programme.versions[0].duration / 60 : 0,
            firstBroadcast: programme.first_broadcast_date ?? undefined,
            link: `https://www.bbc.co.uk/programmes/${pid}`,
            thumbnail: programme.image
                ? `https://ichef.bbci.co.uk/images/ic/1920x1080/${programme.image.pid}.jpg`
                : undefined,
            type,
        };
    }

    async getMetadata(pid: string): Promise<IPlayerMetadataResponse> {
        const { data }: { data: IPlayerMetadataResponse } = await axios.get(
            `https://www.bbc.co.uk/programmes/${pid}.json`
        );
        return data;
    }

    async findBrandForPid(pid: string, checked: string[] = []): Promise<string | undefined> {
        const { programme }: IPlayerMetadataResponse = await this.getMetadata(pid);
        if (programme.type == 'brand') {
            return programme.pid;
        } else if (programme.parent) {
            if (!checked.includes(programme.parent.programme.pid) && programme.parent.programme.pid != pid) {
                return await this.findBrandForPid(programme.parent.programme.pid, [...checked, pid]);
            }
        }
        return undefined;
    }

    async getSeriesEpisodes(pid: string): Promise<IPlayerEpisodeMetadata[]> {
        try {
            const response: AxiosResponse<IPlayerEpisodesResponse> = await axios.get(
                `https://ibl.api.bbci.co.uk/ibl/v1/programmes/${encodeURIComponent(pid)}/episodes?per_page=${searchResultLimit}`
            );
            return response.data.programme_episodes.elements;
        } catch {
            return [];
        }
    }

    async findBrandForUrl(url: string): Promise<string | undefined> {
        const match = url.replace('/episodes', '').match(pidRegex);
        if (match) {
            const pid = match[1];
            return await this.findBrandForPid(pid);
        }
    }
}

export default new IPlayerDetailsService();
