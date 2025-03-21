export interface NewzNabSearchResponse {
    $: {
        version: string;
        'xmlns:atom': string;
        'xmlns:newznab': string;
    };
    channel: {
        'atom:link': { $: { rel: string; type: string } };
        title: string;
        item: NewzNabTVFeedItem[];
    };
}

interface NewzNabTVFeedItem {
    title: string;
    description: string;
    guid: string;
    comments: string;
    size: string;
    category: string[];
    pubDate: string;
    'newznab:attr': NewzNabAttr[];
    link: string;
    enclosure: { $: { url: string; length: string; type: string } };
}

export interface NewzNabAttr {
    $: { name: string; value: string };
}
