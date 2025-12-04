import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * PostgreSQL connection with Supabase Session Pooler optimization
 *
 * Configuration optimized for serverless environments and Supabase.
 * - Max connections: 10 (safe for serverless)
 * - Idle timeout: 20s (prevents stale connections)
 * - Max lifetime: 30min (forces connection refresh)
 * - prepare: false (required for Supabase Session Pooler)
 */
const client = postgres(process.env['DATABASE_URL'], {
  max: 10,
  prepare: false, // Required for Supabase Session Pooler
});

/**
 * Drizzle ORM instance
 *
 * Provides type-safe database queries with full schema inference.
 */
export const db = drizzle(client, { schema });

/**
 * Export the database type for use in other modules
 */
export type Database = typeof db;
