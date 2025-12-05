import { z } from 'zod';

/**
 * Billing validation schemas using Zod
 *
 * These schemas provide:
 * - Runtime type validation
 * - Client-side form validation
 * - Server-side input sanitization
 * - Type inference for TypeScript
 */

/**
 * Create checkout schema
 *
 * Validates input for creating a LemonSqueezy checkout session.
 *
 * @example
 * ```typescript
 * const input = createCheckoutSchema.parse({
 *   planId: 'uuid-here',
 *   redirectUrl: 'https://example.com/dashboard',
 * });
 * ```
 */
export const createCheckoutSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  redirectUrl: z.string().url('Invalid redirect URL').optional(),
});

/**
 * Type inference for createCheckoutSchema
 */
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
