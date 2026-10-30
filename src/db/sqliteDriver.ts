import Database from 'better-sqlite3';
import { and, asc, count, desc, eq, lt, notInArray, sql } from 'drizzle-orm';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'fs';
import path from 'path';

import { DatabaseDriver, KeyValueEntry } from './DatabaseDriver';
import { kvStore, meta, queueEntries, sessions } from './schema.sqlite';

export class SqliteDriver implements DatabaseDriver {
    readonly dialect = 'sqlite';
    private sqlite: Database.Database;
    private db: BetterSQLite3Database;

    constructor(file: string, migrationsFolder: string) {
        if (file !== ':memory:') {
            fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
        }
        this.sqlite = new Database(file);
        this.sqlite.pragma('journal_mode = WAL');
        this.sqlite.pragma('synchronous = NORMAL');
        this.sqlite.pragma('busy_timeout = 5000');
        this.db = drizzle(this.sqlite);
        migrate(this.db, { migrationsFolder });
    }

    async kvGet(key: string): Promise<string | undefined> {
        return this.db.select().from(kvStore).where(eq(kvStore.key, key)).get()?.value;
    }

    async kvSet(key: string, value: string): Promise<void> {
        this.db.insert(kvStore).values({ key, value }).onConflictDoUpdate({ target: kvStore.key, set: { value } }).run();
    }

    async kvInsertIfMissing(key: string, value: string): Promise<boolean> {
        return this.db.insert(kvStore).values({ key, value }).onConflictDoNothing().run().changes > 0;
    }

    async kvDelete(key: string): Promise<void> {
        this.db.delete(kvStore).where(eq(kvStore.key, key)).run();
    }

    async kvEntries(): Promise<KeyValueEntry[]> {
        return this.db.select().from(kvStore).all();
    }

    async sessionGet(sid: string): Promise<string | undefined> {
        const row = this.db.select().from(sessions).where(eq(sessions.sid, sid)).get();
        return row && row.expiresAt > Date.now() ? row.data : undefined;
    }

    async sessionSet(sid: string, data: string, expiresAt: number): Promise<void> {
        this.db
            .insert(sessions)
            .values({ sid, data, expiresAt })
            .onConflictDoUpdate({ target: sessions.sid, set: { data, expiresAt } })
            .run();
    }

    async sessionInsertIfMissing(sid: string, data: string, expiresAt: number): Promise<boolean> {
        return this.db.insert(sessions).values({ sid, data, expiresAt }).onConflictDoNothing().run().changes > 0;
    }

    async sessionDelete(sid: string): Promise<void> {
        this.db.delete(sessions).where(eq(sessions.sid, sid)).run();
    }

    async sessionPurgeExpired(now: number): Promise<void> {
        this.db.delete(sessions).where(lt(sessions.expiresAt, now)).run();
    }

    async queueAppend(queue: string, data: string, maxSize: number): Promise<void> {
        this.db.transaction((tx) => {
            tx.insert(queueEntries).values({ queue, data }).run();
            const keep = tx
                .select({ id: queueEntries.id })
                .from(queueEntries)
                .where(eq(queueEntries.queue, queue))
                .orderBy(desc(queueEntries.id))
                .limit(maxSize)
                .all()
                .map((r) => r.id);
            tx.delete(queueEntries)
                .where(and(eq(queueEntries.queue, queue), notInArray(queueEntries.id, keep)))
                .run();
        });
    }

    async queueItems(queue: string): Promise<string[]> {
        return this.db
            .select({ data: queueEntries.data })
            .from(queueEntries)
            .where(eq(queueEntries.queue, queue))
            .orderBy(desc(queueEntries.id))
            .all()
            .map((r) => r.data);
    }

    async queuePeekOldest(queue: string): Promise<string | undefined> {
        return this.db
            .select({ data: queueEntries.data })
            .from(queueEntries)
            .where(eq(queueEntries.queue, queue))
            .orderBy(asc(queueEntries.id))
            .limit(1)
            .get()?.data;
    }

    async queueShiftOldest(queue: string): Promise<string | undefined> {
        return this.db.transaction((tx) => {
            const row = tx
                .select()
                .from(queueEntries)
                .where(eq(queueEntries.queue, queue))
                .orderBy(asc(queueEntries.id))
                .limit(1)
                .get();
            if (row) {
                tx.delete(queueEntries).where(eq(queueEntries.id, row.id)).run();
            }
            return row?.data;
        });
    }

    async queueSize(queue: string): Promise<number> {
        return this.db.select({ n: count() }).from(queueEntries).where(eq(queueEntries.queue, queue)).get()?.n ?? 0;
    }

    async queueIsEmpty(queue: string): Promise<boolean> {
        return (await this.queueSize(queue)) === 0;
    }

    async queueClear(queue: string): Promise<void> {
        this.db.delete(queueEntries).where(eq(queueEntries.queue, queue)).run();
    }

    async metaGet(key: string): Promise<string | undefined> {
        return this.db.select().from(meta).where(eq(meta.key, key)).get()?.value;
    }

    async metaSet(key: string, value: string): Promise<void> {
        this.db.insert(meta).values({ key, value }).onConflictDoUpdate({ target: meta.key, set: { value } }).run();
    }

    async ping(): Promise<void> {
        this.db.run(sql`select 1`);
    }

    async close(): Promise<void> {
        this.sqlite.close();
    }
}
