import { parseStringPromise } from 'xml2js';

import CapsEndpoint from '../../../server/endpoints/newznab/CapsEndpoint';
import { makeEvent, responseHeader } from '../../helpers/h3';

describe('CapsEndpoint', () => {
    it('responds with valid XML and correct headers', async () => {
        const event = makeEvent();

        const xml = await CapsEndpoint(event);

        expect(responseHeader(event, 'content-type')).toBe('application/xml');
        expect(typeof xml).toBe('string');

        const parsed = await parseStringPromise(xml);

        expect(parsed).toHaveProperty('caps');
        expect(parsed.caps).toHaveProperty('server');
        expect(parsed.caps).toHaveProperty('limits');
        expect(parsed.caps).toHaveProperty('searching');
        expect(parsed.caps).toHaveProperty('categories');
    });
});
