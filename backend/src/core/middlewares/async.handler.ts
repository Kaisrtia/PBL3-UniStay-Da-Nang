import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to the next error-handling middleware.
 *
 * Eliminates the need for try/catch blocks in every controller.
 *
 * Usage:
 *   router.get('/users', asyncHandler(getUsers));
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
