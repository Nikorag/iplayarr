import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'p00bp2rm',
        position: 5,
        image: { pid: 'p08vxx0m' },
        media_type: 'audio_video',
        title: 'Dimension Jump',
        short_synopsis:
      'In a parallel universe, an Arnold Rimmer exists who\u0027s charming, popular, brave and modest',
        medium_synopsis:
      'In a parallel universe, another Arnold Rimmer exists, but he\u0027s charming, popular, brave and modest. After his craft breaks the speed of reality, he meets his counterpart.',
        long_synopsis:
      'In a universe almost identical to our own, another Arnold Rimmer exists, but he\u0027s charming, popular, brave and modest. After his craft breaks the speed of reality, he finds himself meeting his counterpart.',
        first_broadcast_date: '1991-03-14T21:00:00Z',
        display_title: { title: 'Red Dwarf', subtitle: 'IV, Dimension Jump' },
        ownership: {
            service: { type: 'tv', id: 'bbc_two', key: 'bbctwo', title: 'BBC Two' },
        },
        parent: {
            programme: {
                type: 'series',
                pid: 'p006cxh3',
                title: 'IV',
                short_synopsis:
          'The fourth series of the cult space comedy set aboard the space mining ship Red Dwarf.',
                position: 4,
                image: { pid: 'p0fwp8mb' },
                expected_child_count: 6,
                first_broadcast_date: '1991-02-14T21:00:00Z',
                aggregated_episode_count: 6,
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
        peers: {
            previous: {
                type: 'episode',
                pid: 'p00bp2qk',
                title: 'White Hole',
                first_broadcast_date: '1991-03-07T21:00:00Z',
                position: 4,
                media_type: 'audio_video',
            },
            next: {
                type: 'episode',
                pid: 'p00bp2t0',
                title: 'Meltdown',
                first_broadcast_date: '1991-03-21T21:00:00Z',
                position: 6,
                media_type: 'audio_video',
            },
        },
        versions: [
            {
                canonical: 1,
                pid: 'p00bp2rn',
                duration: 1800,
                types: ['Original version'],
            },
            { canonical: 0, pid: 'p02nqnmx', duration: 1800, types: ['Store only'] },
            {
                canonical: 0,
                pid: 'p0ft94fb',
                duration: 1800,
                types: ['Technical Replacement'],
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
