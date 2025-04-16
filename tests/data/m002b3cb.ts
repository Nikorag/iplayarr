import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'm002b3cb',
        image: { pid: 'p0fj0528' },
        media_type: 'audio_video',
        title: '13/04/2025',
        short_synopsis: 'The latest news from the BBC.',
        medium_synopsis: 'The latest news from the BBC.',
        long_synopsis: 'The latest news from the BBC.',
        first_broadcast_date: '2025-04-13T23:00:00+01:00',
        display_title: { title: 'BBC News', subtitle: '13/04/2025' },
        ownership: {
            service: {
                id: 'bbc_news',
                key: 'news',
                title: 'BBC News',
            },
        },
        parent: {
            programme: {
                type: 'brand',
                pid: 'm000m3ds',
                title: 'BBC News',
                short_synopsis: 'The latest news from the BBC.',
                image: { pid: 'p0fj0528' },
                first_broadcast_date: '2020-03-31T10:00:00+01:00',
                aggregated_episode_count: 16390,
                ownership: {
                    service: {
                        id: 'bbc_news',
                        key: 'news',
                        title: 'BBC News',
                    },
                },
            },
        },
        peers: {
            previous: {
                type: 'episode',
                pid: 'm002b3c8',
                title: '13/04/2025',
                first_broadcast_date: '2025-04-13T22:00:00+01:00',
                media_type: 'audio_video',
            },
            next: {
                type: 'episode',
                pid: 'm002b3hs',
                title: '13/04/2025',
                first_broadcast_date: '2025-04-14T00:00:00+01:00',
                media_type: 'audio_video',
            },
        },
        versions: [
            {
                canonical: 1,
                pid: 'm002b3c9',
                duration: 1560,
                types: ['Original version'],
            },
        ],
        links: [],
        supporting_content_items: [],
        categories: [
            {
                type: 'format',
                id: 'PT003',
                key: 'bulletins',
                title: 'Bulletins',
                narrower: [],
                broader: {},
                has_topic_page: false,
            },
            {
                type: 'genre',
                id: 'C00079',
                key: 'news',
                title: 'News',
                narrower: [],
                broader: {},
                has_topic_page: false,
            },
        ],
    },
} as IPlayerMetadataResponse;
