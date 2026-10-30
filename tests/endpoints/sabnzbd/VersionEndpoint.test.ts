import VersionEndpoint from '../../../server/endpoints/sabnzbd/VersionEndpoint';

describe('VersionEndpoint', () => {
    it('responds with the correct version JSON', () => {
        expect(VersionEndpoint()).toEqual({
            version: '1.0.0',
        });
    });
});
