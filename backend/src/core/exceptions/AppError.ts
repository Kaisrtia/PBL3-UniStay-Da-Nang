/**
 * Custom application error class for operational errors.
 * Extends the built-in Error class with HTTP status code support.
 *
 * Usage:
 *   throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Restore prototype chain (required when extending built-in classes in TS)
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}
