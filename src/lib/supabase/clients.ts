import { createServerClient as _createServerClient, createBrowserClient as _createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase Client Configuration
 *
 * This file exports three distinct Supabase clients for different use cases:
 * 1. createServerClient  - Server Components, Server Actions, Route Handlers
 * 2. createBrowserClient - Client Components (browser-side)
 * 3. createAdminClient    - Admin operations with service_role key
 */

// ============================================================================
// SERVER CLIENT (SSR with cookies)
// ============================================================================

/**
 * Server-side Supabase client with session management
 *
 * Use in:
 * - Server Components (read-only operations)
 * - Server Actions (mutations allowed)
 * - Route Handlers (API routes)
 *
 * Session cookies are automatically refreshed in middleware.
 *
 * @example
 * ```typescript
 * // Server Component
 * const supabase = await createServerClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 *
 * @example
 * ```typescript
 * // Server Action
 * 'use server';
 * const supabase = await createServerClient();
 * await supabase.auth.updateUser({ data: { username: 'new_name' } });
 * ```
 */
export const createServerClient = async () => {
  const cookieStore = await cookies();

  return _createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie mutations may fail in Server Components
            // This is expected behavior - use middleware for session refresh
          }
        },
      },
    }
  );
};

/**
 * Type-safe Supabase server client
 */
export type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

// ============================================================================
// BROWSER CLIENT (Client Components)
// ============================================================================

/**
 * Browser-side Supabase client for Client Components
 *
 * Use in:
 * - Client Components ('use client')
 * - Browser-side event handlers
 * - Client-side forms and interactions
 *
 * Cookie handling is automatic via document.cookie.
 *
 * @example
 * ```typescript
 * 'use client';
 *
 * import { createBrowserClient } from '@/lib/supabase/clients';
 *
 * const supabase = createBrowserClient();
 *
 * const handleLogin = async () => {
 *   const { error } = await supabase.auth.signInWithPassword({
 *     email: 'user@example.com',
 *     password: 'password123'
 *   });
 * };
 * ```
 */
export const createBrowserClient = () =>
  _createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

/**
 * Type-safe Supabase browser client
 */
export type BrowserClient = ReturnType<typeof createBrowserClient>;

// ============================================================================
// ADMIN CLIENT (service_role key)
// ============================================================================

/**
 * Admin Supabase client with service_role key
 *
 * ⚠️ CRITICAL SECURITY WARNING:
 * - Use ONLY for privileged server-side operations
 * - NEVER expose this client to client-side code
 * - NEVER import this in Client Components
 *
 * Valid use cases:
 * - Deleting users (rollback after failed transactions)
 * - Bypassing RLS policies for admin operations
 * - Server-side admin tasks
 *
 * @example
 * ```typescript
 * // Rollback auth user creation if database fails
 * const adminClient = createAdminClient();
 * await adminClient.auth.admin.deleteUser(userId);
 * ```
 *
 * @see https://supabase.com/docs/reference/javascript/auth-admin-deleteuser
 */
export const createAdminClient = () => {
  return _createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin client doesn't need cookie management
        },
      },
    }
  );
};

/**
 * Type-safe Supabase admin client
 */
export type AdminClient = ReturnType<typeof createAdminClient>;
