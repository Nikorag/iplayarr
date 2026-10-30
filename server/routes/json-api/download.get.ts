import { defineEventHandler, getQuery, setResponseStatus } from 'h3';

import iplayerDetailsService from '../../service/iplayerDetailsService';
import queueService from '../../service/queueService';
import { VideoType } from '../../types/IPlayerSearchResult';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { IPlayerMetadataResponse } from '../../types/responses/IPlayerMetadataResponse';

export default defineEventHandler(async (event) => {
    const { pid } = getQuery(event) as any;
    let { nzbName, type } = getQuery(event) as any;

    if (!nzbName || !type) {
        try {
            const metadata: IPlayerMetadataResponse | undefined = await iplayerDetailsService.getMetadata(pid);
            if (!metadata?.programme.display_title) {
                setResponseStatus(event, 500);
                return { error: ApiError.INTERNAL_ERROR, message: 'Unable to find episode details' } as ApiResponse;
            }
            if (!type) {
                const formatCategory = metadata.programme.categories?.find(({ type }) => type == 'format');
                type = formatCategory?.key == 'films' ? VideoType.MOVIE : VideoType.TV;
            }
            if (!nzbName) {
                const { title, subtitle } = metadata.programme.display_title!;
                nzbName = `${title}${type == VideoType.TV && subtitle ? `.${subtitle}` : ''}`;
                nzbName = nzbName.replaceAll('.', '_');
                nzbName = nzbName.replaceAll(' ', '.');
            }
        } catch {
            setResponseStatus(event, 500);
            return { error: ApiError.INTERNAL_ERROR, message: 'Unable to find episode details' } as ApiResponse;
        }
    }

    queueService.addToQueue(pid, nzbName, type);
    return { status: true };
});
