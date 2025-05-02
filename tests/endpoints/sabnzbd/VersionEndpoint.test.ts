import { Request, Response } from 'express';

import VersionEndpoint from '../../../src/endpoints/sabnzbd/VersionEndpoint';

describe('VersionEndpoint', () => {
    it('responds with the correct version JSON', () => {
        const jsonMock = jest.fn();
        const res = {
            json: jsonMock,
        } as unknown as Response;

        VersionEndpoint({} as Request, res);

        expect(jsonMock).toHaveBeenCalledWith({
            version: '1.0.0',
        });
    });
});
