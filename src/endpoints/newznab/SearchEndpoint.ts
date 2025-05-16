import { Request, Response } from 'express';
import { Builder } from 'xml2js';

import searchFacade from '../../facade/searchFacade';
import statisticsService from '../../service/stats/StatisticsService';
import { SearchHistoryEntry } from '../../types/data/SearchHistoryEntry';
import { IPlayerSearchResult, VideoType } from '../../types/IPlayerSearchResult';
import { NewzNabAttr, NewzNabSearchResponse } from '../../types/responses/newznab/NewzNabSearchResponse';
import { createNZBDownloadLink, getBaseUrl } from '../../utils/Utils';

interface SearchRequest {
    q: string;
    season?: number;
    ep?: number;
    cat?: string;
    app?: string;
}

export default async (req: Request, res: Response) => {
    const { q, season, ep, cat: catList, app } = req.query as any as SearchRequest;
    const cat: string[] | undefined = catList ? catList.split(',') : undefined;
    const searchTerm = q ?? '*';
    let results: IPlayerSearchResult[] = await searchFacade.search(searchTerm, season, ep);

    if (cat) {
        results = results.filter(({ type }) => categoriesForType(type).some((category) => cat.includes(category)));
    }

    const historyEntry: SearchHistoryEntry = {
        term: searchTerm,
        results: results.length,
        appId: app,
        series: season,
        episode: ep,
        time: new Date().getTime()
    };
    statisticsService.addSearch(historyEntry);

    const date: Date = new Date();
    date.setMinutes(date.getMinutes() - 720);

    const pubDate: string = date.toUTCString().replace('GMT', '+0000');

    const searchResponse: NewzNabSearchResponse = {
        $: {
            version: '1.0',
            'xmlns:atom': 'http://www.w3.org/2005/Atom',
            'xmlns:newznab': 'http://www.newznab.com/DTD/2010/feeds/attributes/',
        },
        channel: {
            'atom:link': { $: { rel: 'self', type: 'application/rss+xml' } },
            title: 'iPlayarr',
            item: results.map((result) => ({
                title: result.nzbName,
                description: result.nzbName,
                guid: `https://www.bbc.co.uk/iplayer/episodes/${result.pid}`,
                comments: `https://www.bbc.co.uk/iplayer/episodes/${result.pid}`,
                size: result.size ? String(result.size * 1048576) : '2147483648',
                category: categoriesForType(result.type),
                pubDate: result.pubDate ? result.pubDate.toUTCString().replace('GMT', '+0000') : pubDate,
                'newznab:attr': [
                    ...createCategoryAttributes(result.type),
                    { $: { name: 'language', value: 'English' } },
                    { $: { name: 'files', value: '1' } },
                    { $: { name: 'grabs', value: '0' } },
                ],
                link: `${getBaseUrl(req)}${createNZBDownloadLink(result, req.query.apikey as string, app)}`,
                enclosure: {
                    $: {
                        url: `${getBaseUrl(req)}${createNZBDownloadLink(result, req.query.apikey as string, app)}`,
                        length: result.size ? String(result.size * 1048576) : '2147483648',
                        type: 'application/x-nzb',
                    },
                },
            })),
        },
    } as NewzNabSearchResponse;

    const builder = new Builder({ headless: false, xmldec: { version: '1.0', encoding: 'UTF-8' } });
    const xml = builder.buildObject({ rss: searchResponse });

    res.set('Content-Type', 'application/xml');
    res.send(xml);
};

function categoriesForType(type: VideoType): string[] {
    switch (type) {
        case VideoType.MOVIE:
            return ['2000', '2040'];
        case VideoType.TV:
            return ['5000', '5040'];
        case VideoType.UNKNOWN:
            return [];
    }
}

function createCategoryAttributes(type: VideoType): NewzNabAttr[] {
    return categoriesForType(type).map((value) => ({ $: { name: 'category', value } }));
}
