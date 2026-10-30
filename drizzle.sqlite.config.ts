import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'sqlite',
    schema: './src/db/schema.sqlite.ts',
    out: './drizzle/sqlite',
});
