import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'm001zr9t',
        image: { pid: 'p0hzqtss' },
        media_type: 'audio_video',
        title: 'Highlights',
        short_synopsis:
      'Monty Don and Joe Swift look back at the highlights of the RHS Chelsea Flower Show 2024.',
        medium_synopsis:
      'Monty Don and Joe Swift look back at the highlights of their week at the RHS Chelsea Flower Show 2024.',
        first_broadcast_date: '2024-05-25T20:25:00+01:00',
        display_title: {
            title: 'RHS Chelsea Flower Show',
            subtitle: '2024, Highlights',
        },
        ownership: {
            service: { type: 'tv', id: 'bbc_two', key: 'bbctwo', title: 'BBC Two' },
        },
        parent: {
            programme: {
                type: 'series',
                pid: 'm001zh3s',
                title: '2024',
                short_synopsis: 'Coverage of the yearly horticultural event in London',
                position: 2024,
                image: { pid: 'p0hxs0gh' },
                first_broadcast_date: '2024-05-19T18:15:00+01:00',
                aggregated_episode_count: 15,
                ownership: {
                    service: {
                        type: 'tv',
                        id: 'bbc_two',
                        key: 'bbctwo',
                        title: 'BBC Two',
                    },
                },
                parent: {
                    programme: {
                        type: 'brand',
                        pid: 'b007lyhs',
                        title: 'RHS Chelsea Flower Show',
                        short_synopsis:
              'Gardeners go for gold at the world\u0027s most famous flower show.',
                        image: { pid: 'p01zdykh' },
                        first_broadcast_date: '2006-05-21T17:50:00+01:00',
                        aggregated_episode_count: 292,
                        ownership: {
                            service: {
                                type: 'tv',
                                id: 'bbc_two',
                                key: 'bbctwo',
                                title: 'BBC Two',
                            },
                        },
                    },
                },
            },
        },
        peers: {
            previous: {
                type: 'episode',
                pid: 'm001zjnt',
                title: 'Episode 12',
                first_broadcast_date: '2024-05-24T20:00:00+01:00',
                media_type: 'audio_video',
            },
            next: {
                type: 'episode',
                pid: 'm001zpwf',
                title: 'Episode 14',
                first_broadcast_date: '2024-05-26T18:00:00+01:00',
                media_type: 'audio_video',
            },
        },
        versions: [
            {
                canonical: 1,
                pid: 'm001zr9s',
                duration: 3540,
                types: ['Original version'],
            },
        ],
        links: [],
        supporting_content_items: [],
        categories: [
            {
                type: 'genre',
                id: 'C00188',
                key: 'gardens',
                title: 'Gardens',
                narrower: [],
                broader: {
                    category: {
                        type: 'genre',
                        id: 'C00061',
                        key: 'homesandgardens',
                        title: 'Homes \u0026 Gardens',
                        broader: {
                            category: {
                                type: 'genre',
                                id: 'C00045',
                                key: 'factual',
                                title: 'Factual',
                                broader: {},
                                has_topic_page: false,
                            },
                        },
                        has_topic_page: false,
                    },
                },
                has_topic_page: false,
            },
            {
                type: 'genre',
                id: 'C00061',
                key: 'homesandgardens',
                title: 'Homes \u0026 Gardens',
                narrower: [],
                broader: {
                    category: {
                        type: 'genre',
                        id: 'C00045',
                        key: 'factual',
                        title: 'Factual',
                        broader: {},
                        has_topic_page: false,
                    },
                },
                has_topic_page: false,
            },
            {
                type: 'format',
                id: 'PT011',
                key: 'performancesandevents',
                title: 'Performances \u0026 Events',
                narrower: [],
                broader: {},
                has_topic_page: false,
            },
        ],
    },
} as IPlayerMetadataResponse;
