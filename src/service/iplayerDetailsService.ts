import { IPlayerDetails } from '../types/IPlayerDetails';
import { calculateSeasonAndEpisode } from '../utils/Utils';
import episodeCacheService from './episodeCacheService';

class IPlayerDetailsService {
    async details(pids: string[]): Promise<IPlayerDetails[]> {
        return await Promise.all(pids.map((pid) => this.episodeDetails(pid)));
    }

    async episodeDetails(pid: string): Promise<IPlayerDetails> {
        const { programme } = await episodeCacheService.getMetadata(pid);
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
}

export default new IPlayerDetailsService();
