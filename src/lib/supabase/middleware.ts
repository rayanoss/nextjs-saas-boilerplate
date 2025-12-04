import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware Supabase client with session refresh
 *
 * This client is specifically designed for Next.js middleware and provides:
 * - Automatic session refresh for expired auth tokens
 * - Proper cookie mutation on both request and response
 * - Protected route redirection
 *
 * CRITICAL: This is the ONLY place where session refresh should happen.
 * Server components should NOT attempt to refresh sessions.
 */
export const updateSession = async (request: NextRequest) => {
  // Create a mutable response that we can modify
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for immediate use in middleware)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Create a new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          });

          // Set cookies on the response (sent to browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /**
   * CRITICAL: Do NOT use supabase.auth.getUser() here
   *
   * getUser() only validates the JWT locally, it doesn't refresh expired sessions.
   * We MUST use getSession() to trigger automatic session refresh via cookies.
   *
   * This ensures expired sessions are renewed before reaching Server Components.
   */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { response: supabaseResponse, session };
};

/**
 * Type-safe session response
 *
 * Usage in middleware.ts:
 * ```typescript
 * import { updateSession } from '@/lib/supabase/middleware';
 *
 * export async function middleware(request: NextRequest) {
 *   const { response, session } = await updateSession(request);
 *
 *   // Protect routes that require authentication
 *   if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 *
 *   // Redirect authenticated users away from auth pages
 *   if (session && request.nextUrl.pathname.startsWith('/login')) {
 *     return NextResponse.redirect(new URL('/dashboard', request.url));
 *   }
 *
 *   return response;
 * }
 * ```
 */
export type MiddlewareSession = Awaited<ReturnType<typeof updateSession>>;
