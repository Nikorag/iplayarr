export interface KeyValueEntry {
    key: string;
    value: string;
}

export interface DatabaseDriver {
    readonly dialect: 'sqlite' | 'postgres';

    // Key/value store (config, apps, synonyms, history, episode cache...)
    kvGet(key: string): Promise<string | undefined>;
    kvSet(key: string, value: string): Promise<void>;
    /** Insert only if the key doesn't exist yet. Returns true if a row was written. */
    kvInsertIfMissing(key: string, value: string): Promise<boolean>;
    kvDelete(key: string): Promise<void>;
    kvEntries(): Promise<KeyValueEntry[]>;

    // Login sessions
    sessionGet(sid: string): Promise<string | undefined>;
    sessionSet(sid: string, data: string, expiresAt: number): Promise<void>;
    sessionInsertIfMissing(sid: string, data: string, expiresAt: number): Promise<boolean>;
    sessionDelete(sid: string): Promise<void>;
    sessionPurgeExpired(now: number): Promise<void>;

    // Capped FIFO queues. Items are returned newest first.
    queueAppend(queue: string, data: string, maxSize: number): Promise<void>;
    queueItems(queue: string): Promise<string[]>;
    queueShiftOldest(queue: string): Promise<string | undefined>;
    queuePeekOldest(queue: string): Promise<string | undefined>;
    queueSize(queue: string): Promise<number>;
    queueClear(queue: string): Promise<void>;
    queueIsEmpty(queue: string): Promise<boolean>;

    // Bookkeeping (e.g. migration markers)
    metaGet(key: string): Promise<string | undefined>;
    metaSet(key: string, value: string): Promise<void>;

    ping(): Promise<void>;
    close(): Promise<void>;
}
