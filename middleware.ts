import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js Middleware for Authentication & Route Protection
 *
 * This middleware runs on EVERY request before reaching your pages/APIs.
 *
 * Responsibilities:
 * 1. Refresh expired Supabase sessions automatically
 * 2. Protect authenticated routes (redirect to /login if not logged in)
 * 3. Redirect authenticated users away from auth pages
 * 4. Pass through all other requests
 *
 * CRITICAL: This is the ONLY place where session refresh happens.
 */
export async function middleware(request: NextRequest) {
  // Update session and get auth state
  const { response, session } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  /**
   * Protected routes - require authentication
   *
   * Add your protected routes here:
   * - /dashboard
   * - /profile
   * - /settings
   * - etc.
   */
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !session) {
    // Redirect to login with return URL
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  /**
   * Auth pages - redirect if already authenticated
   *
   * Prevents logged-in users from accessing:
   * - /login
   * - /signup
   * - /forgot-password
   */
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && session) {
    // Redirect to dashboard if already logged in
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

/**
 * Matcher configuration
 *
 * Defines which routes this middleware should run on.
 *
 * Current setup:
 * - Runs on all routes EXCEPT:
 *   - /_next/* (Next.js internals)
 *   - /api/* (API routes - handle auth separately if needed)
 *   - /static/* (static files)
 *   - /*.{png,jpg,jpeg,gif,svg,ico,webp} (images)
 *   - /favicon.ico
 *
 * Adjust the matcher to fit your needs.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
