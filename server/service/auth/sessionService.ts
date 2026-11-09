import { randomBytes } from 'crypto';
import { deleteCookie, getCookie, H3Event, setCookie } from 'h3';

import { getDatabase } from '../../db/database';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import User from '../../types/User';
import configService from '../configService';

export interface SessionData {
    user?: User;
    codeVerifier?: string;
    state?: string;
}

export interface Session {
    id: string;
    data: SessionData;
}

const COOKIE_NAME = 'iplayarr.sid';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const getAuthDisabledUser = async (): Promise<User | undefined> => {
    const [authType, username] = await Promise.all([
        configService.getParameter(IplayarrParameter.AUTH_TYPE),
        configService.getParameter(IplayarrParameter.AUTH_USERNAME),
    ]);
    return authType == 'none' ? { username: username || 'admin' } : undefined;
};

const parseCookies = (header: string): Record<string, string> =>
    Object.fromEntries(
        header.split(';').map((pair) => {
            const [name, ...value] = pair.trim().split('=');
            return [name, decodeURIComponent(value.join('='))];
        })
    );

const sessionService = {
    /** Starts the hourly purge of expired sessions. */
    startPurging: () => {
        const purge = () => getDatabase().then((db) => db.sessionPurgeExpired(Date.now())).catch(() => undefined);
        purge();
        setInterval(purge, 60 * 60 * 1000).unref();
    },

    load: async (id: string): Promise<SessionData | undefined> => {
        const raw = await (await getDatabase()).sessionGet(id);
        return raw ? (JSON.parse(raw) as SessionData) : undefined;
    },

    store: async (id: string, data: SessionData): Promise<void> => {
        await (await getDatabase()).sessionSet(id, JSON.stringify(data), Date.now() + SESSION_TTL_MS);
    },

    remove: async (id: string): Promise<void> => {
        await (await getDatabase()).sessionDelete(id);
    },

    /** Returns the session for this request, creating an empty (unsaved) one if there is no valid session cookie. */
    get: async (event: H3Event): Promise<Session> => {
        if (event.context.session) {
            return event.context.session as Session;
        }
        const cookieId = getCookie(event, COOKIE_NAME);
        const existing = cookieId ? await sessionService.load(cookieId) : undefined;
        const session: Session = existing
            ? { id: cookieId as string, data: existing }
            : { id: randomBytes(32).toString('hex'), data: {} };
        event.context.session = session;
        return session;
    },

    /** Persists the session and (re)issues its cookie. Sessions are only stored once something has been saved. */
    save: async (event: H3Event): Promise<void> => {
        const session = await sessionService.get(event);
        await sessionService.store(session.id, session.data);
        setCookie(event, COOKIE_NAME, session.id, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
            maxAge: SESSION_TTL_MS / 1000,
        });
    },

    destroy: async (event: H3Event): Promise<void> => {
        const cookieId = getCookie(event, COOKIE_NAME);
        if (cookieId) {
            await sessionService.remove(cookieId);
        }
        event.context.session = undefined;
        deleteCookie(event, COOKIE_NAME, { path: '/' });
    },

    /**
     * The logged in user for this request. When auth is disabled everyone is treated as the configured user.
     */
    getUser: async (event: H3Event): Promise<User | undefined> => {
        return (await getAuthDisabledUser()) ?? (await sessionService.get(event)).data.user;
    },

    /** As getUser, but for contexts without an H3Event (e.g. a websocket upgrade) where only the Cookie header is available. */
    getUserByCookieHeader: async (cookieHeader?: string | null): Promise<User | undefined> => {
        const authDisabledUser = await getAuthDisabledUser();
        if (authDisabledUser) {
            return authDisabledUser;
        }
        const cookieId = cookieHeader ? parseCookies(cookieHeader)[COOKIE_NAME] : undefined;
        return cookieId ? (await sessionService.load(cookieId))?.user : undefined;
    },
};

export default sessionService;
