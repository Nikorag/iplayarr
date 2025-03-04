export interface TVSearchResponse {
    $: {
        version: string;
        "xmlns:atom": string;
        "xmlns:newznab": string;
    };
    channel: {
        "atom:link": { $: { rel: string; type: string } };
        title: string;
        item: NewzNabTVFeedItem[];
    };
}

interface NewzNabTVFeedItem {
    title: string;
    description: string;
    guid: string;
    size: string;
    category: string[];
    pubDate: string;
    "newznab:attr": NewznabAttr[];
    link: string;
    enclosure: { $: { url: string; length: string; type: string } };
}

interface NewznabAttr {
    $: { name: string; value: string };
}
