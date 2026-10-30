import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';

import { getDatabase } from '../db/database';
import { DatabaseDriver } from '../db/DatabaseDriver';

/**
 * One-off import of data from a previous Redis-backed install.
 *
 * Sources (in order):
 *  1. An external Redis, if REDIS_HOST is set (same env vars as before: REDIS_PORT, REDIS_PASSWORD, REDIS_SSL).
 *  2. The bundled Redis' dump.rdb in REDIS_DATA_DIR (default /config). A throwaway redis-server is started
 *     against a *copy* of the file, so the original is never modified and stays around as a backup.
 *
 * Set SKIP_REDIS_MIGRATION=true to bypass it entirely.
 */

export const MIGRATION_MARKER = 'redis_migration';

const SESSION_PREFIX = 'iplayarr:';
const SESSION_DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const QUEUES: { redisKey: string; queue: string; maxSize: number }[] = [
    { redisKey: 'search-history', queue: 'search-history', maxSize: 500 },
    { redisKey: 'grab-history', queue: 'grab-history', maxSize: 500 },
];

// Everything that used to live in Redis but is now in-memory (caches, logs, uptime)
const EPHEMERAL_PREFIXES = [
    'search_cache_',
    'schedule_cache_',
    'metadata_cache_',
    'skyhook_series_cache_',
    'skyhook_episode_cache_',
    'iplayarr_logs',
    'iplayarr_uptime',
];

/** The subset of ioredis used by the importer */
export interface RedisSource {
    scan(cursor: string, ...args: (string | number)[]): Promise<[string, string[]]>;
    type(key: string): Promise<string>;
    get(key: string): Promise<string | null>;
    pttl(key: string): Promise<number>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
}

export interface MigrationResult {
    keyValues: number;
    sessions: number;
    queueEntries: number;
    skipped: number;
}

export async function importFromRedis(redis: RedisSource, db: DatabaseDriver): Promise<MigrationResult> {
    const result: MigrationResult = { keyValues: 0, sessions: 0, queueEntries: 0, skipped: 0 };

    const keys: string[] = [];
    let cursor = '0';
    do {
        const [next, batch] = await redis.scan(cursor, 'COUNT', 500);
        cursor = next;
        keys.push(...batch);
    } while (cursor !== '0');

    for (const queue of QUEUES) {
        if (!keys.includes(queue.redisKey) || (await db.queueSize(queue.queue)) > 0) {
            continue;
        }
        // Redis lists are newest first, the table is appended oldest first
        const items = (await redis.lrange(queue.redisKey, 0, queue.maxSize - 1)).reverse();
        for (const item of items) {
            await db.queueAppend(queue.queue, item, queue.maxSize);
            result.queueEntries++;
        }
    }

    for (const key of new Set(keys)) {
        if (QUEUES.some((q) => q.redisKey === key) || EPHEMERAL_PREFIXES.some((p) => key.startsWith(p))) {
            continue;
        }
        if ((await redis.type(key)) !== 'string') {
            result.skipped++;
            continue;
        }
        const value = await redis.get(key);
        if (value === null) {
            continue;
        }

        if (key.startsWith(SESSION_PREFIX)) {
            const ttl = await redis.pttl(key);
            if (ttl === -2 || ttl === 0) {
                continue;
            }
            const expiresAt = Date.now() + (ttl > 0 ? ttl : SESSION_DEFAULT_TTL_MS);
            if (await db.sessionInsertIfMissing(key.slice(SESSION_PREFIX.length), value, expiresAt)) {
                result.sessions++;
            }
            continue;
        }

        try {
            JSON.parse(value);
        } catch {
            result.skipped++;
            continue;
        }
        if (await db.kvInsertIfMissing(key, value)) {
            result.keyValues++;
        }
    }

    return result;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function connect(options: Record<string, any>, attempts: number): Promise<any> {
    const { default: Redis } = await import('ioredis');
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
        const client = new Redis({ ...options, lazyConnect: true, retryStrategy: () => null, maxRetriesPerRequest: 1 });
        client.on('error', () => undefined);
        try {
            await client.connect();
            await client.ping();
            return client;
        } catch (error) {
            lastError = error;
            client.disconnect();
            await sleep(parseInt(process.env.REDIS_MIGRATION_RETRY_MS || '1000'));
        }
    }
    throw lastError;
}

function freePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address() as net.AddressInfo;
            server.close(() => resolve(port));
        });
    });
}

async function withBundledRedis<R>(dumpFile: string, work: (client: any) => Promise<R>): Promise<R> {
    const binary = process.env.REDIS_SERVER_BIN || '/redis/redis-server';
    if (!fs.existsSync(binary)) {
        throw new Error(`Found ${dumpFile} but the redis-server binary (${binary}) is not available to read it`);
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iplayarr-redis-'));
    let child: ChildProcess | undefined;
    let client: any;
    try {
        fs.copyFileSync(dumpFile, path.join(tmpDir, 'dump.rdb'));
        const port = await freePort();
        child = spawn(
            binary,
            ['--port', String(port), '--bind', '127.0.0.1', '--dir', tmpDir, '--dbfilename', 'dump.rdb', '--save', '', '--appendonly', 'no'],
            { stdio: 'ignore' }
        );
        child.on('error', () => undefined);
        client = await connect({ host: '127.0.0.1', port }, 30);
        return await work(client);
    } finally {
        client?.disconnect();
        child?.kill('SIGKILL');
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

export async function migrateFromRedisIfNeeded(log: (...args: any[]) => void = console.log): Promise<void> {
    if (process.env.SKIP_REDIS_MIGRATION === 'true') {
        return;
    }

    const db = await getDatabase();
    if (await db.metaGet(MIGRATION_MARKER)) {
        return;
    }

    const dumpFile = path.join(process.env.REDIS_DATA_DIR || '/config', 'dump.rdb');
    let source: string;
    let run: () => Promise<MigrationResult>;

    if (process.env.REDIS_HOST) {
        const host = process.env.REDIS_HOST;
        const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
        source = `external Redis at ${host}:${port}`;
        run = async () => {
            const client = await connect(
                {
                    host,
                    port,
                    password: process.env.REDIS_PASSWORD || undefined,
                    tls: process.env.REDIS_SSL === 'true' ? {} : undefined,
                },
                15
            );
            try {
                return await importFromRedis(client, db);
            } finally {
                client.disconnect();
            }
        };
    } else if (fs.existsSync(dumpFile)) {
        source = `bundled Redis data (${dumpFile})`;
        run = () => withBundledRedis(dumpFile, (client) => importFromRedis(client, db));
    } else {
        return; // Fresh install, nothing to migrate
    }

    log(`Migrating data from ${source} to ${db.dialect}...`);
    let result: MigrationResult;
    try {
        result = await run();
    } catch (error: any) {
        throw new Error(
            `Could not migrate existing data from ${source}: ${error?.message}. ` +
                'Your Redis data has not been touched. Fix the problem and restart, or set SKIP_REDIS_MIGRATION=true to start with a clean database.'
        );
    }

    await db.metaSet(MIGRATION_MARKER, JSON.stringify({ at: new Date().toISOString(), source, ...result }));
    log(
        `Redis migration complete: ${result.keyValues} stored records, ${result.sessions} sessions, ` +
            `${result.queueEntries} history entries (${result.skipped} skipped). Redis is no longer used and can be removed.`
    );
}
