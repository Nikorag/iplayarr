import RadarrArrService from '../../../server/service/arr/RadarrArrService';
import V3ArrService from '../../../server/service/arr/V3ArrService';
import { CreateIndexerRequest } from '../../../server/types/requests/arr/CreateIndexerRequest';

const names = (fields: { name?: string }[]) => fields.map(({ name }) => name);

describe('RadarrArrService payloads', () => {
    const clientForm = { name: 'iPlayarr', host: 'iplayarr', port: 4404, useSSL: false, apiKey: 'k', tags: [] };
    const indexerForm = {
        appId: 'a',
        name: 'iPlayarr',
        downloadClientId: 1,
        url: 'http://iplayarr:4404',
        apiKey: 'k',
        categories: [2010],
        priority: 25,
        tags: [],
    };

    it('only sends movie fields in the download client', () => {
        const request = RadarrArrService.createDownloadClientRequestObject(clientForm, []);
        const fields = names(request.fields);
        expect(fields).toEqual(expect.arrayContaining(['movieCategory', 'recentMoviePriority', 'olderMoviePriority']));
        expect(fields).not.toEqual(expect.arrayContaining(['tvCategory']));
        expect(fields).not.toEqual(expect.arrayContaining(['recentTvPriority']));
        expect(fields).not.toEqual(expect.arrayContaining(['olderTvPriority']));
        expect(request.infoLink).toContain('radarr');
    });

    it('keeps the tv fields for Sonarr and drops the movie one', () => {
        const fields = names(V3ArrService.createDownloadClientRequestObject(clientForm, []).fields);
        expect(fields).toEqual(expect.arrayContaining(['tvCategory', 'recentTvPriority', 'olderTvPriority']));
        expect(fields).not.toContain('movieCategory');
    });

    it('does not send Sonarr only indexer settings', () => {
        const request = RadarrArrService.createIndexerRequestObject(indexerForm, []) as CreateIndexerRequest;
        const fields = names(request.fields);
        expect(fields).not.toContain('animeCategories');
        expect(fields).not.toContain('animeStandardFormatSearch');
        expect(request).not.toHaveProperty('seasonSearchMaximumSingleEpisodeAge');
        expect(fields).toEqual(expect.arrayContaining(['baseUrl', 'apiPath', 'apiKey', 'categories']));
    });

    it('still sends them for Sonarr', () => {
        const request = V3ArrService.createIndexerRequestObject(indexerForm, []) as CreateIndexerRequest;
        expect(names(request.fields)).toContain('animeCategories');
        expect(request).toHaveProperty('seasonSearchMaximumSingleEpisodeAge');
    });
});
