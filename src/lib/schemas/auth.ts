import { z } from 'zod';

/**
 * Authentication validation schemas using Zod
 *
 * These schemas provide:
 * - Runtime type validation
 * - Client-side form validation
 * - Server-side input sanitization
 * - Type inference for TypeScript
 */

/**
 * Email validation
 * - Must be valid email format
 * - Automatically normalized to lowercase
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .toLowerCase()
  .trim();

/**
 * Password validation
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Username validation
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - Cannot start/end with underscore
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username cannot exceed 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .regex(/^[a-zA-Z0-9]/, 'Username cannot start with an underscore')
  .regex(/[a-zA-Z0-9]$/, 'Username cannot end with an underscore')
  .toLowerCase()
  .trim();

/**
 * Sign up schema
 * - Email (required, normalized)
 * - Password (required, strong validation)
 * - Username (required, unique)
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
});

/**
 * Sign in schema
 * - Email (required)
 * - Password (required, no strength validation on login)
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Password reset request schema
 * - Email (required)
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset confirmation schema
 * - New password (required, strong validation)
 * - Confirm password (must match)
 */
export const resetPasswordConfirmSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Update password schema (for authenticated users)
 * - Current password (required)
 * - New password (required, strong validation)
 * - Confirm new password (must match)
 */
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Update email schema
 * - New email (required, normalized)
 */
export const updateEmailSchema = z.object({
  email: emailSchema,
});

/**
 * Update username schema
 * - New username (required, validated)
 */
export const updateUsernameSchema = z.object({
  username: usernameSchema,
});

/**
 * Type inference exports
 *
 * Usage:
 * ```typescript
 * import type { SignUpInput } from '@/lib/schemas/auth';
 *
 * const handleSignUp = async (data: SignUpInput) => {
 *   // data is fully typed and validated
 * };
 * ```
 */
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>;
