import session, { SessionData } from 'express-session';

import { getDatabase } from './database';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export class DatabaseSessionStore extends session.Store {
    constructor() {
        super();
        const purge = () => getDatabase().then((db) => db.sessionPurgeExpired(Date.now())).catch(() => undefined);
        purge();
        setInterval(purge, 60 * 60 * 1000).unref();
    }

    private expiry(sess: SessionData): number {
        const expires = sess.cookie?.expires ? new Date(sess.cookie.expires).getTime() : NaN;
        return Number.isNaN(expires) ? Date.now() + DEFAULT_TTL_MS : expires;
    }

    get(sid: string, callback: (err?: any, session?: SessionData | null) => void): void {
        getDatabase()
            .then((db) => db.sessionGet(sid))
            .then((data) => callback(null, data ? (JSON.parse(data) as SessionData) : null), callback);
    }

    set(sid: string, sess: SessionData, callback?: (err?: any) => void): void {
        getDatabase()
            .then((db) => db.sessionSet(sid, JSON.stringify(sess), this.expiry(sess)))
            .then(() => callback?.(), (err) => callback?.(err));
    }

    touch(sid: string, sess: SessionData, callback?: () => void): void {
        this.set(sid, sess, () => callback?.());
    }

    destroy(sid: string, callback?: (err?: any) => void): void {
        getDatabase()
            .then((db) => db.sessionDelete(sid))
            .then(() => callback?.(), (err) => callback?.(err));
    }
}
