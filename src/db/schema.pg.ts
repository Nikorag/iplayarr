import { bigint, index, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const kvStore = pgTable('kv_store', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});

export const sessions = pgTable('sessions', {
    sid: text('sid').primaryKey(),
    data: text('data').notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
});

export const queueEntries = pgTable(
    'queue_entries',
    {
        id: serial('id').primaryKey(),
        queue: text('queue').notNull(),
        data: text('data').notNull(),
    },
    (t) => [index('queue_entries_queue_idx').on(t.queue, t.id)]
);

export const meta = pgTable('meta', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});
