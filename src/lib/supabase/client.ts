import { createBrowserClient } from '@supabase/ssr';

/**
 * Client-side Supabase client (singleton pattern)
 *
 * This client is designed for use in:
 * - Client Components ('use client')
 * - Browser-side event handlers
 * - Client-side forms and interactions
 *
 * The singleton pattern ensures a single Supabase instance across
 * the entire application lifecycle, improving performance and
 * maintaining consistent session state.
 *
 * Cookie handling is automatic via document.cookie.
 */
export const createClient = () =>
  createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

/**
 * Type-safe Supabase browser client
 *
 * Usage in Client Components:
 * ```typescript
 * 'use client';
 *
 * const supabase = createClient();
 *
 * const handleLogin = async () => {
 *   const { error } = await supabase.auth.signInWithPassword({
 *     email: 'user@example.com',
 *     password: 'password123'
 *   });
 * };
 * ```
 */
export type BrowserClient = ReturnType<typeof createClient>;
