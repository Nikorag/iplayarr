import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'b0211hsl',
        image: { pid: 'p01l9ftp' },
        media_type: 'audio_video',
        title: 'Red Button Special',
        short_synopsis:
      'Celebrating \u0027skyrise greening\u0027 and sharing top tips on plants for unusual spaces.',
        medium_synopsis:
      'Professor Nigel Dunnett explains his rooftop garden which celebrates \u0027skyrise greening\u0027 and looks at water management in a wonderful living, outside/inside spatial experience.',
        long_synopsis:
      'One hundred years on from the inception of the RHS Chelsea Flower Show, our cities have grown in size both upwards as well as outwards. However as Professor Nigel Dunnett explains, this shouldn\u0027t stop you from trying your hand at having a garden or cultivated outside space. His rooftop garden this year celebrates \u0027skyrise greening\u0027 and looks at water management in a wonderful living, outside/inside spatial experience.\n\nTom Hart-Dyke also scours the Great Pavilion for top tips on plants for unusual spaces and challenging conditions whether it be soil, shade or damp as he goes on a hunt to bring us the best plants for tricky environments. It would seem there\u0027s no excuse for not gardening!',
        first_broadcast_date: '2013-05-25T12:00:00+01:00',
        display_title: {
            title: 'RHS Chelsea Flower Show',
            subtitle: '2013, Red Button Special',
        },
        ownership: {
            service: { type: 'tv', id: 'bbc_two', key: 'bbctwo', title: 'BBC Two' },
        },
        parent: {
            programme: {
                type: 'series',
                pid: 'p018hk6n',
                title: '2013',
                short_synopsis:
          'Coverage of the yearly horticultural event happening in London.',
                position: 7,
                image: { pid: 'p01l9ftp' },
                expected_child_count: 15,
                first_broadcast_date: '2013-05-19T17:00:00+01:00',
                aggregated_episode_count: 16,
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
                pid: 'b01t03kr',
                title: 'Episode 13',
                first_broadcast_date: '2013-05-24T20:00:00+01:00',
                position: 13,
                media_type: 'audio_video',
            },
            next: {
                type: 'episode',
                pid: 'b0214t3p',
                title: 'Episode 14',
                first_broadcast_date: '2013-05-25T19:00:00+01:00',
                position: 14,
                media_type: 'audio_video',
            },
        },
        versions: [
            {
                canonical: 1,
                pid: 'b0211hsj',
                duration: 1200,
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
