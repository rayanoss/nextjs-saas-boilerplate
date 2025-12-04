import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local file
config({ path: '.env.local' });

if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL is not defined in .env.local');
}

export default defineConfig({
  out: './src/lib/db/migrations',
  schema: './src/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'],
  },
  verbose: true,
  strict: true,
});
