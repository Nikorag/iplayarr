import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'm000jbtq',
        position: 5,
        image: { pid: 'p08d4pr0' },
        media_type: 'audio_video',
        title: 'Making the Most of Your Time',
        short_synopsis:
      'Nicki Chapman and the team help you make the most of your time in your own garden.',
        medium_synopsis:
      'Nicki Chapman and the team help you make the most of your time in your own garden, including ideas for low-maintenance lawns.',
        long_synopsis:
      'Nicki Chapman and the team help you make the most of your time in your own garden. They reveal some beautiful flowers that are really easy to grow and some plants that need virtually no attention. There are ideas for low-maintenance lawns and border planting that takes very little effort.   We find out why spending very little time on orchids could make them even prettier and show how they can be used in a very Instagram-friendly display that needs virtually no maintenance.',
        first_broadcast_date: '2020-05-22T15:45:00+01:00',
        display_title: {
            title: 'RHS Chelsea Flower Show',
            subtitle: 'Your Chelsea Flower Show, Making the Most of Your Time',
        },
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
                type: 'series',
                pid: 'm000jbqb',
                title: 'Your Chelsea Flower Show',
                short_synopsis:
          'A week of inspiring programmes from the greatest flower show in the world.',
                image: { pid: 'p08d4rwj' },
                expected_child_count: 5,
                first_broadcast_date: '2020-05-18T15:45:00+01:00',
                aggregated_episode_count: 5,
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
                pid: 'm000jbw4',
                title: 'Making the Most of Your Budget',
                first_broadcast_date: '2020-05-21T15:45:00+01:00',
                position: 4,
                media_type: 'audio_video',
            }
        },
        versions: [
            {
                canonical: 1,
                pid: 'm000jbtn',
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
