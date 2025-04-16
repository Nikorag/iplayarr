import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

export default {
    programme: {
        type: 'episode',
        pid: 'm001kscd',
        image: { pid: 'p0fbqr8s' },
        media_type: 'audio_video',
        title: 'Children of Men',
        short_synopsis:
      'In a future where children are no longer born, a loner helps a pregnant woman to safety.',
        medium_synopsis:
      'In a chaotic future Britain where no child has been born for years, a loner helps the world\u0027s only known pregnant woman to safety.',
        long_synopsis:
      '2027. In a chaotic future, children are no longer being born because of a years-long fertility crisis. Borders are closed, and Britain has become a brutal police state, with immigrants herded into cages and treated like animals.\n\nGovernment employee Theo receives a message from someone from his past, asking for help getting a refugee some papers. But Theo is soon drawn into something much bigger than himself. Kee is not just a refugee needing help - she is pregnant.',
        first_broadcast_date: '2023-04-02T22:00:00+01:00',
        display_title: { title: 'Children of Men', subtitle: '' },
        ownership: {
            service: { type: 'tv', id: 'bbc_two', key: 'bbctwo', title: 'BBC Two' },
        },
        versions: [
            {
                canonical: 1,
                pid: 'm001ksc7',
                duration: 5880,
                types: ['Original version'],
            },
            {
                canonical: 0,
                pid: 'p0g9rtwn',
                duration: 5880,
                types: ['Dubbed Audio Described'],
            },
        ],
        links: [],
        supporting_content_items: [],
        categories: [
            {
                type: 'genre',
                id: 'C00017',
                key: 'drama',
                title: 'Drama',
                narrower: [],
                broader: {},
                has_topic_page: false,
            },
            {
                type: 'format',
                id: 'PT007',
                key: 'films',
                title: 'Films',
                narrower: [],
                broader: {},
                has_topic_page: false,
            },
            {
                type: 'genre',
                id: 'C00035',
                key: 'scifiandfantasy',
                title: 'SciFi \u0026 Fantasy',
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
