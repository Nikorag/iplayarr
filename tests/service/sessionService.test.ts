import { SqliteDriver } from '../../server/db/sqliteDriver';
import sessionService from '../../server/service/auth/sessionService';
import configService from '../../server/service/configService';

let driver: SqliteDriver;

jest.mock('../../server/db/database', () => ({ getDatabase: () => Promise.resolve(driver) }));
jest.mock('../../server/service/configService');

describe('sessionService', () => {
    beforeEach(() => {
        driver = new SqliteDriver(':memory:', 'drizzle/sqlite');
    });

    afterEach(() => driver.close());

    describe('getUserByCookieHeader', () => {
        it('returns the user for a valid session cookie', async () => {
            await sessionService.store('abc123', { user: { username: 'admin' } });

            const user = await sessionService.getUserByCookieHeader('other=1; iplayarr.sid=abc123');

            expect(user).toEqual({ username: 'admin' });
        });

        it('returns undefined when there is no cookie or the session is unknown', async () => {
            expect(await sessionService.getUserByCookieHeader(undefined)).toBeUndefined();
            expect(await sessionService.getUserByCookieHeader('other=1')).toBeUndefined();
            expect(await sessionService.getUserByCookieHeader('iplayarr.sid=missing')).toBeUndefined();
        });

        it('returns the configured user without needing a session when AUTH_TYPE is none', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('none').mockResolvedValueOnce('haven');

            expect(await sessionService.getUserByCookieHeader(undefined)).toEqual({ username: 'haven' });
        });

        it('falls back to an admin user when auth is none and no username is configured', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('none').mockResolvedValueOnce(undefined);

            expect(await sessionService.getUserByCookieHeader(undefined)).toEqual({ username: 'admin' });
        });
    });

    describe('expiry', () => {
        it('does not load sessions that have expired', async () => {
            await driver.sessionSet('old', JSON.stringify({ user: { username: 'admin' } }), Date.now() - 1);

            expect(await sessionService.load('old')).toBeUndefined();
        });
    });
});
