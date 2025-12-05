/**
 * Custom Error Classes for Application
 *
 * These error classes follow next-safe-action best practices for robust error handling.
 * Each error type has a specific purpose and will be handled differently by the error handler.
 *
 * @see https://next-safe-action.dev/docs/define-actions/create-the-client#handleservererror
 */

/**
 * Base class for application errors
 */
export class AppError extends Error {
  public override readonly cause?: unknown; // Original error for logging (never exposed to client)

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation Error - For business logic validation failures
 *
 * Use this when user input is technically valid (passed Zod validation)
 * but fails business rules (e.g., username already taken, email exists).
 *
 * These errors should be displayed to the user under the relevant field.
 *
 * @example
 * ```ts
 * throw new ValidationError('Username is already taken', 'username');
 * throw new ValidationError('Email already registered', 'email');
 * ```
 */
export class ValidationError extends AppError {
  public readonly field?: string; // Optional: specific field that failed validation

  constructor(message: string, field?: string, cause?: unknown) {
    super(message, cause);
    if (field !== undefined) {
      this.field = field;
    }
  }
}

/**
 * Authentication Error - For authentication/authorization failures
 *
 * Use this when credentials are invalid, session expired, or user lacks permission.
 *
 * @example
 * ```ts
 * throw new AuthenticationError('Invalid email or password');
 * throw new AuthenticationError('Session expired');
 * throw new AuthenticationError('You must be logged in');
 * ```
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Database Error - For database/infrastructure failures
 *
 * Use this for technical errors (connection failed, timeout, constraint violation).
 * These will be masked in production with a generic message.
 *
 * @example
 * ```ts
 * throw new DatabaseError('Connection timeout');
 * throw new DatabaseError('Unique constraint violation');
 * ```
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database error occurred', cause?: unknown) {
    super(message, cause);
  }
}

/**
 * External API Error - For third-party service failures
 *
 * Use this when external APIs (Stripe, SendGrid, etc.) fail.
 * These will be masked in production.
 *
 * @example
 * ```ts
 * throw new ExternalAPIError('Failed to send email');
 * throw new ExternalAPIError('Payment processing failed');
 * ```
 */
export class ExternalAPIError extends AppError {
  constructor(message = 'External service error', cause?: unknown) {
    super(message, cause);
  }
}
