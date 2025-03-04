export interface NewzNabServerConfig {
    server: { $: { title: string } };
    limits: { $: { default: string; max: string } };
    searching: {
        search: { $: { available: string; supportedParams: string } };
        "tv-search": { $: { available: string; supportedParams: string } };
        "movie-search": { $: { available: string; supportedParams: string } };
        "music-search": { $: { available: string; supportedParams: string } };
        "audio-search": { $: { available: string; supportedParams: string } };
        "book-search": { $: { available: string; supportedParams: string } };
    };
    categories: {
        category: NewzNabCategory[];
    };
    tags: string;
}

export interface NewzNabCategory {
    $: { id: string; name: string };
    subcat?: NewzNabCategory[];
}