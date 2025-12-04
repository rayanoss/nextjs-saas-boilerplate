import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client
 *
 * This client is designed for use in:
 * - Server Components (read-only operations)
 * - Server Actions (mutations allowed)
 * - Route Handlers (API routes)
 *
 * Session cookies are automatically refreshed in the middleware,
 * so this client should primarily focus on data fetching and mutations.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
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
 *
 * Usage in Server Components:
 * ```typescript
 * const supabase = await createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 *
 * Usage in Server Actions:
 * ```typescript
 * 'use server';
 * const supabase = await createClient();
 * await supabase.auth.updateUser({ data: { username: 'new_name' } });
 * ```
 */
export type ServerClient = Awaited<ReturnType<typeof createClient>>;
