import { Request, Response } from 'express';
import searchHistoryService from 'src/service/searchHistoryService';
import searchService from 'src/service/searchService';
import { IPlayerSearchResult, VideoType } from 'src/types/data/IPlayerSearchResult';
import { SearchHistoryEntry } from 'src/types/data/SearchHistoryEntry';
import { NewzNabAttr, NewzNabSearchResponse } from 'src/types/responses/newznab/NewzNabSearchResponse';
import { createNZBDownloadLink, getBaseUrl } from 'src/utils/Utils';
import { Builder } from 'xml2js'

interface SearchQueryString {
    q: string,
    season?: number,
    ep?: number,
    cat?: string,
    app?: string
}

export default async (req: Request, res: Response) => {
    const { q, season, ep, cat, app }: SearchQueryString = req.query as any;

    const searchTerm = q ?? '*';

    let results: IPlayerSearchResult[] = await searchService.search(searchTerm, season, ep);
    results = filterResultsForCategory(results, cat);

    addSearchHistoryEntry(searchTerm, results, app, season, ep);

    const fallbackPubDate = getFallbackPubDate();


    const searchResponse: NewzNabSearchResponse = {
        $: {
            version: '1.0',
            'xmlns:atom': 'http://www.w3.org/2005/Atom',
            'xmlns:newznab': 'http://www.newznab.com/DTD/2010/feeds/attributes/'
        },
        channel: {
            'atom:link': { $: { rel: 'self', type: 'application/rss+xml' } },
            title: 'iPlayarr',
            item: results.map((result) => (
                {
                    title: result.nzbName,
                    description: result.nzbName,
                    guid: `https://www.bbc.co.uk/iplayer/episodes/${result.pid}`,
                    comments: `https://www.bbc.co.uk/iplayer/episodes/${result.pid}`,
                    size: result.size ? String(result.size * 1048576) : '2147483648',
                    category: categoriesForType(result.type),
                    pubDate: result.pubDate ? result.pubDate.toUTCString().replace('GMT', '+0000') : fallbackPubDate,
                    'newznab:attr': [
                        ...createCategoryAttributes(result.type),
                        { $: { name: 'language', value: 'English' } },
                        { $: { name: 'files', value: '1' } },
                        { $: { name: 'grabs', value: '0' } }
                    ],
                    link: `${getBaseUrl(req)}${createNZBDownloadLink(result, req.query.apikey as string, app)}`,
                    enclosure: { $: { url: `${getBaseUrl(req)}${createNZBDownloadLink(result, req.query.apikey as string, app)}`, length: result.size ? String(result.size * 1048576) : '2147483648', type: 'application/x-nzb' } }
                }
            ))
        }
    } as NewzNabSearchResponse

    const builder = new Builder({ headless: false, xmldec: { version: '1.0', encoding: 'UTF-8' } });
    const xml = builder.buildObject({ rss: searchResponse });

    res.set('Content-Type', 'application/xml');
    res.send(xml);
}

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

function filterResultsForCategory(results: IPlayerSearchResult[], catStr?: string): IPlayerSearchResult[] {
    if (catStr) {
        const cat = catStr.split(',');
        return results.filter(({ type }) => categoriesForType(type).some(category => cat.includes(category)));
    }
    return results;
}

function addSearchHistoryEntry(searchTerm: string, results: IPlayerSearchResult[], appId?: string, series?: number, episode?: number) {
    if (searchTerm != '*') {
        const historyEntry: SearchHistoryEntry = {
            term: searchTerm,
            results: results.length,
            appId,
            series,
            episode,
        }
        searchHistoryService.addItem(historyEntry);
    }
}

function getFallbackPubDate(): string {
    const date: Date = new Date();
    date.setMinutes(date.getMinutes() - 720);

    return date.toUTCString().replace('GMT', '+0000');
}