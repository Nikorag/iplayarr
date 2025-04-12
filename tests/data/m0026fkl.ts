import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'm0026fkl',
        position: 4,
        image: { pid: 'p0k99rdl' },
        media_type: 'audio_video',
        title: 'Christmas Special 2024',
        short_synopsis:
      'DI Goodman investigates a festive ghost story where there\u2019s more to it than meets the eye.',
        medium_synopsis:
      'When a widower starts seeing the ghost of his late wife, DS Esther Williams is deeply sceptical, but DI Humphrey Goodman is more than happy to dive into his first haunting.',
        long_synopsis:
      'Whilst home alone watching family videos, Bob encounters a surprise visitor - his late wife\u2019s ghost, Linda, who has a haunting demand: get out. When there\u2019s a second unsettling encounter and writing on a mirror, Humphrey and the team are called in to investigate. Esther is deeply sceptical, but Humphrey is more than happy to dive into his first haunting. Surely there\u2019s a rational explanation?',
        first_broadcast_date: '2024-12-27T21:00:00Z',
        display_title: {
            title: 'Beyond Paradise',
            subtitle: 'Christmas Special 2024',
        },
        ownership: {
            service: { type: 'tv', id: 'bbc_one', key: 'bbcone', title: 'BBC One' },
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
        peers: {
            previous: {
                type: 'episode',
                pid: 'm001tvp5',
                title: 'Christmas Special 2023',
                first_broadcast_date: '2023-12-24T21:00:00Z',
                position: 2,
                media_type: 'audio_video',
            },
        },
        versions: [
            {
                canonical: 1,
                pid: 'm0026fkk',
                duration: 3420,
                types: ['Original version'],
            },
            {
                canonical: 0,
                pid: 'p0kd2b54',
                duration: 3420,
                types: ['Dubbed Audio Described'],
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
                has_topic_page: false
            },
        ],
    },
} as IPlayerMetadataResponse;
