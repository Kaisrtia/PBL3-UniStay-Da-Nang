import { Request, Response, NextFunction } from 'express';
import { AppError } from '../exceptions/AppError';

/**
 * Global error-handling middleware.
 *
 * - AppError instances → returns the defined statusCode + message.
 * - Unknown errors     → returns 500 Internal Server Error.
 *
 * Response shape (standardized):
 * {
 *   "success": false,
 *   "error": {
 *     "code": 404,
 *     "message": "User not found"
 *   }
 * }
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  void next;
  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.statusCode,
        message: err.message
      }
    });
    return;
  }

  // Log unexpected errors for debugging
  console.error('Unexpected error:', err);

  // Handle unknown / programmer errors
  res.status(500).json({
    success: false,
    error: {
      code: 500,
      message: 'Internal server error'
    }
  });
};
