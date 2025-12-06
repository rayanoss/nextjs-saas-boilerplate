import { returnValidationErrors } from 'next-safe-action';
import { ValidationError } from '@/lib/errors';
import type { z } from 'zod';

/**
 * Helper function to handle ValidationError and convert to next-safe-action validation errors
 *
 * This eliminates repetitive code in actions when catching ValidationErrors from services.
 *
 * @param error - The caught error (unknown type from catch block)
 * @param schema - The Zod schema used for validation
 *
 * @example
 * ```ts
 * try {
 *   await signUpUser(parsedInput);
 * } catch (error) {
 *   handleValidationError(error, signUpSchema);
 *   throw error;
 * }
 * ```
 */
export function handleValidationError(error: unknown, schema: z.ZodSchema) {
  if (error instanceof ValidationError && error.field) {
    returnValidationErrors(schema, {
      [error.field]: {
        _errors: [error.message],
      },
    });
  }
}
