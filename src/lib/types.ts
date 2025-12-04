/**
 * Centralized type definitions
 *
 * This file re-exports and extends types from:
 * - Database schema (Drizzle)
 * - Validation schemas (Zod)
 * - Supabase clients
 *
 * Benefits:
 * - Single source of truth for types
 * - Easier refactoring
 * - Consistent type usage across the app
 */

// Database types
export type { User, NewUser } from './db/schema';

// Auth schema types
export type {
  SignUpInput,
  SignInInput,
  ResetPasswordRequestInput,
  ResetPasswordConfirmInput,
  UpdatePasswordInput,
  UpdateEmailInput,
  UpdateUsernameInput,
} from './schemas/auth';

// Supabase client types
export type { ServerClient } from './supabase/server';
export type { BrowserClient } from './supabase/client';
export type { MiddlewareSession } from './supabase/middleware';

/**
 * Auth result type for server actions
 *
 * Standardized response format for all auth operations.
 */
export type AuthResult<T = null> =
  | {
      success: true;
      data: T;
      error: null;
    }
  | {
      success: false;
      data: null;
      error: string;
    };

/**
 * Session user type (simplified from Supabase)
 *
 * Contains essential user info from Supabase Auth session.
 */
export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  lastSignInAt?: string;
}
