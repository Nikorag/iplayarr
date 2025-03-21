import { Request, Response } from 'express';
import { Builder } from 'xml2js';

import { NewzNabServerConfig } from '../../types/responses/newznab/CapsResponse';

export default async (_ : Request, res : Response) => {
    const serverConfig : NewzNabServerConfig = {
        server: { $: { title: 'iPlayarr' } },
        limits: { $: { default: '100', max: '100' } },
        searching: {
            search: { $: { available: 'yes', supportedParams: 'q' } },
            'tv-search': { $: { available: 'yes', supportedParams: 'q,season,ep' } },
            'movie-search': { $: { available: 'yes', supportedParams: 'q' } },
            'music-search': { $: { available: 'no', supportedParams: 'q' } },
            'audio-search': { $: { available: 'no', supportedParams: 'q' } },
            'book-search': { $: { available: 'no', supportedParams: 'q' } }
        },
        categories: {
            category: [
                { $: { id: '0', name: 'Other' } },
                { $: { id: '2000', name: 'Movies' }, subcat : [
                    { $: { id: '2010', name: 'Movies/Foreign' } },
                    { $: { id: '2020', name: 'Movies/Other' } },
                    { $: { id: '2030', name: 'Movies/SD' } },
                    { $: { id: '2040', name: 'Movies/HD' } },
                    { $: { id: '2050', name: 'Movies/BluRay' } },
                    { $: { id: '2060', name: 'Movies/3D' } }
                ]},
                { $: { id: '5000', name: 'TV' }, subcat: [
                    { $: { id: '5040', name: 'TV/HD' } }
                ]}
            ]
        },
        tags: ''
    }

    const builder = new Builder({ headless: true });
    const xml = builder.buildObject({caps: serverConfig});
    res.set('Content-Type', 'application/xml');
    res.send(xml);
}