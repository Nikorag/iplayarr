import { AbstractCreateIndexerRequest } from '../../types/requests/arr/AbstractCreateIndexerRequest';
import { ArrCreateDownloadClientRequest, CreateDownloadClientRequestField } from '../../types/requests/arr/CreateDownloadClientRequest';
import { CreateIndexerRequest } from '../../types/requests/arr/CreateIndexerRequest';
import { CreateDownloadClientForm } from '../../types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../../types/requests/form/CreateIndexerForm';
import { V3ArrService } from './V3ArrService';

const SONARR_ONLY_INDEXER_FIELDS = ['animeCategories', 'animeStandardFormatSearch'];

const MOVIE_PRIORITY_FIELDS: Record<string, { name: string; label: string; helpText: string }> = {
    recentTvPriority: {
        name: 'recentMoviePriority',
        label: 'Recent Priority',
        helpText: 'Priority to use when grabbing movies that were released within the last 21 days',
    },
    olderTvPriority: {
        name: 'olderMoviePriority',
        label: 'Older Priority',
        helpText: 'Priority to use when grabbing movies that were released over 21 days ago',
    },
};

class RadarrArrService extends V3ArrService {
    protected excludedDownloadClientFields: string[] = ['tvCategory'];

    createDownloadClientRequestObject(form: CreateDownloadClientForm, tags: number[]): ArrCreateDownloadClientRequest {
        const request = super.createDownloadClientRequestObject(form, tags);

        request.infoLink = 'https://wiki.servarr.com/radarr/supported#sabnzbd';
        request.fields = request.fields.map((field: CreateDownloadClientRequestField) => {
            const movie = MOVIE_PRIORITY_FIELDS[field.name as string];
            if (field.name === 'movieCategory') {
                return { ...field, helpText: field.helpText?.replace(/Sonarr/g, 'Radarr') };
            }
            return movie ? { ...field, ...movie } : field;
        });

        return request;
    }

    createIndexerRequestObject(form: CreateIndexerForm, tags: number[]): AbstractCreateIndexerRequest {
        const request = super.createIndexerRequestObject(form, tags) as CreateIndexerRequest;

        // Radarr has no seasons or anime
        delete (request as Partial<CreateIndexerRequest>).seasonSearchMaximumSingleEpisodeAge;
        request.infoLink = 'https://wiki.servarr.com/radarr/supported#newznab';
        request.fields = request.fields
            .filter(({ name }) => !SONARR_ONLY_INDEXER_FIELDS.includes(name as string))
            .map((field) =>
                field.name === 'failDownloads'
                    ? { ...field, helpText: field.helpText?.replace('Sonarr', 'Radarr') }
                    : field
            );

        return request;
    }
}

export default new RadarrArrService();
