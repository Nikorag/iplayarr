import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'm0029c0g',
        position: 1,
        image: { pid: 'p0kzjr9f' },
        media_type: 'audio_video',
        title: 'Episode 1',
        short_synopsis:
      'When a body is found in a river, Humphrey must dig into the murky depths of a new mystery.',
        medium_synopsis:
      'When a body is found in the river on the county border, Humphrey and Esther are brought face to face with their Cornish counterparts.',
        long_synopsis:
      'When a body is found in the river on the county border between Devon and Cornwall, Humphrey and Esther are thrown in at the deep end, having to work alongside their Cornish counterparts. While their rivals are quick to brush off the death as a tragic accident, Humphrey\u2019s instincts tell him there may be more lurking under the surface.\n\nMeanwhile, Martha has her hands full as Ten Mile Kitchen expands to a bigger and bolder venue. With the demands of their careers ever growing, Martha and Humphrey start to consider what their future may hold.',
        first_broadcast_date: '2025-03-28T20:00:00Z',
        display_title: {
            title: 'Beyond Paradise',
            subtitle: 'Series 3, Episode 1',
        },
        ownership: {
            service: { type: 'tv', id: 'bbc_one', key: 'bbcone', title: 'BBC One' },
        },
        parent: {
            programme: {
                type: 'series',
                pid: 'm0029c0h',
                title: 'Series 3',
                short_synopsis:
          'DI Humphrey Goodman and his fianc\u00e9e Martha juggle the demands of their life in Devon.',
                position: 5,
                image: { pid: 'p0kypgz7' },
                expected_child_count: 6,
                first_broadcast_date: '2025-03-28T20:00:00Z',
                aggregated_episode_count: 5,
                ownership: {
                    service: {
                        type: 'tv',
                        id: 'bbc_one',
                        key: 'bbcone',
                        title: 'BBC One',
                    },
                },
                parent: {
                    programme: {
                        type: 'brand',
                        pid: 'm001jg5h',
                        title: 'Beyond Paradise',
                        short_synopsis:
              'Humphrey Goodman joins the police in fianc\u00e9e Martha\u0027s hometown of Shipton Abbott in Devon.',
                        image: { pid: 'p0hhg3v3' },
                        first_broadcast_date: '2023-02-24T20:00:00Z',
                        aggregated_episode_count: 21,
                        ownership: {
                            service: {
                                type: 'tv',
                                id: 'bbc_one',
                                key: 'bbcone',
                                title: 'BBC One',
                            },
                        },
                    },
                },
            },
        },
        peers: {
            next: {
                type: 'episode',
                pid: 'm0029lwr',
                title: 'Episode 2',
                first_broadcast_date: '2025-04-04T20:00:00+01:00',
                position: 2,
                media_type: 'audio_video',
            },
        },
        versions: [
            {
                canonical: 0,
                pid: 'm0029c0f',
                duration: 3420,
                types: ['Technical Replacement'],
            },
            {
                canonical: 0,
                pid: 'm0029m24',
                duration: 3420,
                types: ['Sign language'],
            },
            {
                canonical: 0,
                pid: 'p0kz9q73',
                duration: 3420,
                types: ['Technical Replacement', 'Dubbed Audio Described'],
            },
            {
                canonical: 0,
                pid: 'p0l229xw',
                duration: 3420,
                types: ['Sign language', 'Dubbed Audio Described'],
            },
        ],
        links: [],
        supporting_content_items: [],
        categories: [
            {
                type: 'genre',
                id: 'C00021',
                key: 'crime',
                title: 'Crime',
                narrower: [],
                broader: {
                    category: {
                        type: 'genre',
                        id: 'C00017',
                        key: 'drama',
                        title: 'Drama',
                        broader: {},
                        has_topic_page: false,
                    },
                },
                has_topic_page: false,
            },
        ],
    },
} as IPlayerMetadataResponse;
