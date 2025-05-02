import { Request, Response } from 'express';
import { parseStringPromise } from 'xml2js';

import CapsEndpoint from '../../../src/endpoints/newznab/CapsEndpoint';

describe('CapsEndpoint', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let sendMock: jest.Mock;
    let setMock: jest.Mock;

    beforeEach(() => {
        sendMock = jest.fn();
        setMock = jest.fn();
        req = {};
        res = {
            set: setMock,
            send: sendMock,
        };
    });

    it('responds with valid XML and correct headers', async () => {
        await CapsEndpoint(req as Request, res as Response);

        expect(setMock).toHaveBeenCalledWith('Content-Type', 'application/xml');
        expect(sendMock).toHaveBeenCalled();

        const xml = sendMock.mock.calls[0][0];
        expect(typeof xml).toBe('string');

        const parsed = await parseStringPromise(xml);

        expect(parsed).toHaveProperty('caps');
        expect(parsed.caps).toHaveProperty('server');
        expect(parsed.caps).toHaveProperty('limits');
        expect(parsed.caps).toHaveProperty('searching');
        expect(parsed.caps).toHaveProperty('categories');
    });
});
