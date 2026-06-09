import { Response } from 'express';

/**
 * Standardized success response helper.
 *
 * Response shape:
 * {
 *   "success": true,
 *   "data": { ... },       // optional
 *   "message": "..."       // optional
 * }
 */
export const sendSuccess = (
  res: Response,
  statusCode: number,
  data?: unknown,
  message?: string
) => {
  const body: Record<string, unknown> = { success: true };

  if (data !== undefined && data !== null) {
    body.data = data;
  }

  if (message) {
    body.message = message;
  }

  res.status(statusCode).json(body);
};
