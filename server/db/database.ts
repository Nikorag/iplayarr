import path from 'path';

import { DatabaseDriver } from './DatabaseDriver';

let driverPromise: Promise<DatabaseDriver> | undefined;

const migrationsFolder = (dialect: string) => path.join(process.cwd(), 'drizzle', dialect);

async function createDriver(): Promise<DatabaseDriver> {
    const url = process.env.DATABASE_URL;
    if (url && /^postgres(ql)?:\/\//i.test(url)) {
        const { PostgresDriver } = await import('./postgresDriver');
        return PostgresDriver.connect(url, migrationsFolder('postgres'));
    }
    if (url) {
        throw new Error('DATABASE_URL must be a postgres:// or postgresql:// connection string. Unset it to use SQLite.');
    }
    const file = process.env.SQLITE_PATH || path.join(process.cwd(), 'config', 'iplayarr.db');
    const { SqliteDriver } = await import('./sqliteDriver');
    return new SqliteDriver(file, migrationsFolder('sqlite'));
}

/** Lazily connects (and applies schema migrations) on first use. */
export function getDatabase(): Promise<DatabaseDriver> {
    driverPromise ??= createDriver();
    return driverPromise;
}

export async function closeDatabase(): Promise<void> {
    if (driverPromise) {
        const driver = await driverPromise;
        driverPromise = undefined;
        await driver.close();
    }
}
