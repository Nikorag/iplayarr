import { AxiosError } from 'axios';

import { formatArrError } from '../../server/utils/arrError';

const axiosError = (status: number | undefined, data?: unknown, code?: string): AxiosError => {
    const err = new AxiosError('Request failed', code, undefined, undefined, status ? ({ status, data } as any) : undefined);
    return err;
};

describe('formatArrError', () => {
    it('joins Servarr validation failures', () => {
        const err = axiosError(400, [
            { propertyName: 'Host', errorMessage: 'Unable to connect to SABnzbd' },
            { errorMessage: 'Something else' },
        ]);
        expect(formatArrError(err)).toBe('Host: Unable to connect to SABnzbd; Something else');
    });

    it('uses a message from an object body', () => {
        expect(formatArrError(axiosError(500, { message: 'Boom' }))).toBe('Boom');
    });

    it('explains authentication failures', () => {
        expect(formatArrError(axiosError(401))).toBe('Authentication failed, check the API key');
    });

    it('falls back to the status code', () => {
        expect(formatArrError(axiosError(502, '<html>'))).toBe('Request failed with status code 502');
    });

    it('explains network failures', () => {
        expect(formatArrError(axiosError(undefined, undefined, 'ECONNREFUSED'))).toBe(
            'Could not connect: connection refused'
        );
    });

    it('passes through non axios errors', () => {
        expect(formatArrError(new Error('plain'))).toBe('plain');
    });
});
