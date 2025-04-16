import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'm001zh50',
        image: { pid: 'p0hz4zsw' },
        media_type: 'audio_video',
        title: 'Episode 1',
        short_synopsis:
      'All the glitz and glamour of opening day of the RHS Chelsea Flower Show 2024.',
        medium_synopsis:
      'Nicki Chapman and Angellica Bell have exclusive access to the glitz and glamour of opening day of the RHS Chelsea Flower Show 2024.',
        long_synopsis:
      'Nicki Chapman and Angellica Bell have exclusive access to the glitz and glamour of opening day of the RHS Chelsea Flower Show 2024.  They\u2019re joined by a team of gardening experts, including Carol Klein who\u0027ll br showing us how to recreate the latest look for a colourful summer border, Toby Buckland who\u2019ll be helping us solve some of our most common garden design dilemmas, and James Wong who\u2019ll have the ultimate beginner\u2019s guide to buying, styling and caring for houseplants.',
        first_broadcast_date: '2024-05-20T15:45:00+01:00',
        display_title: {
            title: 'RHS Chelsea Flower Show',
            subtitle: '2024, Episode 1',
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
                pid: 'm001zh3r',
                title: 'RHS: Countdown to Chelsea',
                first_broadcast_date: '2024-05-19T18:15:00+01:00',
                media_type: 'audio_video',
            },
            next: {
                type: 'episode',
                pid: 'm001zjhq',
                title: 'Episode 2',
                first_broadcast_date: '2024-05-20T20:00:00+01:00',
                media_type: 'audio_video',
            },
        },
        versions: [
            {
                canonical: 1,
                pid: 'm001zh4z',
                duration: 2640,
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
