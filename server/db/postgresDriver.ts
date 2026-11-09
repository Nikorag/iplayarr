import { and, asc, count, desc, eq, lt, notInArray, sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import { DatabaseDriver, KeyValueEntry } from './DatabaseDriver';
import { kvStore, meta, queueEntries, sessions } from './schema.pg';

export class PostgresDriver implements DatabaseDriver {
    readonly dialect = 'postgres';
    private pool: Pool;
    private db: NodePgDatabase;

    private constructor(pool: Pool) {
        this.pool = pool;
        this.db = drizzle(pool);
    }

    static async connect(connectionString: string, migrationsFolder: string): Promise<PostgresDriver> {
        const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
        const driver = new PostgresDriver(new Pool({ connectionString, ssl }));
        await migrate(driver.db, { migrationsFolder });
        return driver;
    }

    async kvGet(key: string): Promise<string | undefined> {
        const [row] = await this.db.select().from(kvStore).where(eq(kvStore.key, key));
        return row?.value;
    }

    async kvSet(key: string, value: string): Promise<void> {
        await this.db.insert(kvStore).values({ key, value }).onConflictDoUpdate({ target: kvStore.key, set: { value } });
    }

    async kvInsertIfMissing(key: string, value: string): Promise<boolean> {
        const rows = await this.db.insert(kvStore).values({ key, value }).onConflictDoNothing().returning();
        return rows.length > 0;
    }

    async kvDelete(key: string): Promise<void> {
        await this.db.delete(kvStore).where(eq(kvStore.key, key));
    }

    async kvEntries(): Promise<KeyValueEntry[]> {
        return this.db.select().from(kvStore);
    }

    async sessionGet(sid: string): Promise<string | undefined> {
        const [row] = await this.db.select().from(sessions).where(eq(sessions.sid, sid));
        return row && row.expiresAt > Date.now() ? row.data : undefined;
    }

    async sessionSet(sid: string, data: string, expiresAt: number): Promise<void> {
        await this.db
            .insert(sessions)
            .values({ sid, data, expiresAt })
            .onConflictDoUpdate({ target: sessions.sid, set: { data, expiresAt } });
    }

    async sessionInsertIfMissing(sid: string, data: string, expiresAt: number): Promise<boolean> {
        const rows = await this.db.insert(sessions).values({ sid, data, expiresAt }).onConflictDoNothing().returning();
        return rows.length > 0;
    }

    async sessionDelete(sid: string): Promise<void> {
        await this.db.delete(sessions).where(eq(sessions.sid, sid));
    }

    async sessionPurgeExpired(now: number): Promise<void> {
        await this.db.delete(sessions).where(lt(sessions.expiresAt, now));
    }

    async queueAppend(queue: string, data: string, maxSize: number): Promise<void> {
        await this.db.transaction(async (tx) => {
            // Serialise appends per queue so trimming can't race
            await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${queue}))`);
            await tx.insert(queueEntries).values({ queue, data });
            const keep = (
                await tx
                    .select({ id: queueEntries.id })
                    .from(queueEntries)
                    .where(eq(queueEntries.queue, queue))
                    .orderBy(desc(queueEntries.id))
                    .limit(maxSize)
            ).map((r) => r.id);
            await tx.delete(queueEntries).where(and(eq(queueEntries.queue, queue), notInArray(queueEntries.id, keep)));
        });
    }

    async queueItems(queue: string): Promise<string[]> {
        const rows = await this.db
            .select({ data: queueEntries.data })
            .from(queueEntries)
            .where(eq(queueEntries.queue, queue))
            .orderBy(desc(queueEntries.id));
        return rows.map((r) => r.data);
    }

    async queuePeekOldest(queue: string): Promise<string | undefined> {
        const [row] = await this.db
            .select({ data: queueEntries.data })
            .from(queueEntries)
            .where(eq(queueEntries.queue, queue))
            .orderBy(asc(queueEntries.id))
            .limit(1);
        return row?.data;
    }

    async queueShiftOldest(queue: string): Promise<string | undefined> {
        return this.db.transaction(async (tx) => {
            await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${queue}))`);
            const [row] = await tx
                .select()
                .from(queueEntries)
                .where(eq(queueEntries.queue, queue))
                .orderBy(asc(queueEntries.id))
                .limit(1);
            if (row) {
                await tx.delete(queueEntries).where(eq(queueEntries.id, row.id));
            }
            return row?.data;
        });
    }

    async queueSize(queue: string): Promise<number> {
        const [row] = await this.db.select({ n: count() }).from(queueEntries).where(eq(queueEntries.queue, queue));
        return Number(row?.n ?? 0);
    }

    async queueIsEmpty(queue: string): Promise<boolean> {
        return (await this.queueSize(queue)) === 0;
    }

    async queueClear(queue: string): Promise<void> {
        await this.db.delete(queueEntries).where(eq(queueEntries.queue, queue));
    }

    async metaGet(key: string): Promise<string | undefined> {
        const [row] = await this.db.select().from(meta).where(eq(meta.key, key));
        return row?.value;
    }

    async metaSet(key: string, value: string): Promise<void> {
        await this.db.insert(meta).values({ key, value }).onConflictDoUpdate({ target: meta.key, set: { value } });
    }

    async ping(): Promise<void> {
        await this.db.execute(sql`select 1`);
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}
