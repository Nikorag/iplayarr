import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'p0fq3s31',
        image: { pid: 'p0fwp8mb' },
        media_type: 'audio_video',
        title: 'The Promised Land',
        short_synopsis: 'The posse meet three cat clerics who worship Lister.',
        medium_synopsis:
      'The posse meet three cat clerics who worship Lister. They\u0027re being hunted by Rodon, the feral cat leader who wants to wipe out cats who worship anyone but him.',
        display_title: {
            title: 'Red Dwarf',
            subtitle: 'Special, The Promised Land',
        },
        ownership: {
            service: { type: 'tv', id: 'bbc_two', key: 'bbctwo', title: 'BBC Two' },
        },
        parent: {
            programme: {
                type: 'series',
                pid: 'p0fw61rj',
                title: 'Special',
                short_synopsis: 'The universe\u0027s favourite sitcom.',
                position: 13,
                image: { pid: 'p0fwp8mb' },
                aggregated_episode_count: 1,
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
                        pid: 'b008ncn6',
                        title: 'Red Dwarf',
                        short_synopsis: 'Cult space comedy by Rob Grant and Doug Naylor.',
                        image: { pid: 'p0fwp8mb' },
                        first_broadcast_date: '1988-02-15T21:00:00Z',
                        aggregated_episode_count: 73,
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
        versions: [
            {
                canonical: 1,
                pid: 'p0fq3s8s',
                duration: 5340,
                types: ['Original version'],
            },
        ],
        links: [],
        supporting_content_items: [],
        categories: [
            {
                type: 'genre',
                id: 'C00196',
                key: 'sitcoms',
                title: 'Sitcoms',
                narrower: [],
                broader: {
                    category: {
                        type: 'genre',
                        id: 'C00193',
                        key: 'comedy',
                        title: 'Comedy',
                        broader: {},
                        has_topic_page: false,
                    },
                },
                has_topic_page: false,
            },
        ],
    },
} as IPlayerMetadataResponse;
