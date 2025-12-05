/**
 * Centralized Type Exports (Barrel File)
 *
 * Re-exports all types from modular type files.
 * Import from here for convenience, or import specific type files for better tree-shaking.
 *
 * @example
 * ```typescript
 * // Option 1: Import from barrel (convenient)
 * import { User, SignUpInput, ServerClient } from '@/lib/types';
 *
 * // Option 2: Import from specific file (better tree-shaking)
 * import { User } from '@/lib/types/database';
 * import { SignUpInput } from '@/lib/types/auth';
 * ```
 */

// Database types
export type { User, NewUser } from './database';

// Auth types
export type {
  SignUpInput,
  SignInInput,
  ResetPasswordRequestInput,
  ResetPasswordConfirmInput,
  UpdatePasswordInput,
  UpdateEmailInput,
  UpdateUsernameInput,
  AuthResult,
  SessionUser,
} from './auth';

// Supabase client types
export type { ServerClient, BrowserClient, AdminClient, MiddlewareSession } from './supabase';

// Billing types
export type {
  Plan,
  NewPlan,
  Subscription,
  NewSubscription,
  WebhookEvent,
  NewWebhookEvent,
  SubscriptionWithPlan,
  CheckoutOptions,
  SubscriptionStatus,
  WebhookEventName,
  LemonSqueezyWebhookPayload,
} from './billing';
