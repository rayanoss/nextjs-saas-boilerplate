/**
 * Authentication Types
 *
 * Types for authentication flows, inputs, and responses.
 */

// Zod-validated input types
export type {
  SignUpInput,
  SignInInput,
  ResetPasswordRequestInput,
  ResetPasswordConfirmInput,
  UpdatePasswordInput,
  UpdateEmailInput,
  UpdateUsernameInput,
} from '../schemas/auth';

/**
 * Auth result type for server actions
 *
 * Standardized response format for all auth operations.
 *
 * @example
 * ```typescript
 * // Success
 * const result: AuthResult<User> = {
 *   success: true,
 *   data: user,
 *   error: null,
 * };
 *
 * // Error
 * const result: AuthResult = {
 *   success: false,
 *   data: null,
 *   error: 'Invalid credentials',
 * };
 * ```
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
