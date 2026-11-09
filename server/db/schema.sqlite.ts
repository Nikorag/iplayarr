import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const kvStore = sqliteTable('kv_store', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});

export const sessions = sqliteTable('sessions', {
    sid: text('sid').primaryKey(),
    data: text('data').notNull(),
    expiresAt: integer('expires_at').notNull(),
});

export const queueEntries = sqliteTable(
    'queue_entries',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        queue: text('queue').notNull(),
        data: text('data').notNull(),
    },
    (t) => [index('queue_entries_queue_idx').on(t.queue, t.id)]
);

export const meta = sqliteTable('meta', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});
