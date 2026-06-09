import { NextFunction, Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
import * as authController from '../controllers/authenticate.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import config from '../../../core/config/config';
import {
  createRateLimiter,
  normalizedEmailKey
} from '../../../core/middlewares/rateLimit.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import {
  emailVerificationRequestSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from '../validation/auth.validation';

const authRouter = Router();

const authIpLimit = (keyPrefix: string, maxRequests = 10) =>
  createRateLimiter({
    keyPrefix: `${keyPrefix}:ip`,
    maxRequests,
    windowMs: 15 * 60 * 1000
  });

const authEmailLimit = (
  keyPrefix: string,
  maxRequests: number,
  windowMs = 15 * 60 * 1000
) =>
  createRateLimiter({
    keyPrefix: `${keyPrefix}:email`,
    maxRequests,
    windowMs,
    keyGenerator: normalizedEmailKey
  });

const verifyAuthCookieOrigin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const origin = req.get('origin');

  if (origin && origin !== config.frontend_origin) {
    res.status(HttpStatus.FORBIDDEN).json({
      success: false,
      error: {
        code: HttpStatus.FORBIDDEN,
        message: 'Request origin is not allowed'
      }
    });
    return;
  }

  next();
};

// -- Authentication --

// Create a new user account
authRouter.post(
  '/register',
  authIpLimit('register', 5),
  authEmailLimit('register', 3, 60 * 60 * 1000),
  validate(registerSchema),
  asyncHandler(authController.handleRegister)
);

// Authenticate with email & password
authRouter.post(
  '/login',
  authIpLimit('login'),
  authEmailLimit('login', 5),
  verifyAuthCookieOrigin,
  validate(loginSchema),
  asyncHandler(authController.handleLogin)
);

// Authenticate with Google ID token
authRouter.post(
  '/login/google',
  authIpLimit('google-login', 20),
  verifyAuthCookieOrigin,
  validate(googleLoginSchema),
  asyncHandler(authController.handleGoogleLogin)
);

// -- Sessions --

authRouter.delete(
  '/sessions',
  verifyAuthCookieOrigin,
  asyncHandler(authController.handleDeleteSession)
);

authRouter.post(
  '/sessions/refresh',
  verifyAuthCookieOrigin,
  asyncHandler(authController.handleRefreshSession)
);

// -- Email Verification --

// Send OTP verification code
authRouter.post(
  '/email-verification',
  authIpLimit('send-email-verification'),
  authEmailLimit('send-email-verification', 3, 60 * 60 * 1000),
  validate(emailVerificationRequestSchema),
  asyncHandler(authController.handleSendEmailVerification)
);

// Verify OTP code and complete verification
authRouter.patch(
  '/email-verification',
  authIpLimit('verify-email', 20),
  authEmailLimit('verify-email', 8),
  validate(verifyEmailSchema),
  asyncHandler(authController.handleVerifyEmail)
);

// -- Forgot Password --

// Send password reset link
authRouter.post(
  '/forgot-password',
  authIpLimit('forgot-password'),
  authEmailLimit('forgot-password', 3, 60 * 60 * 1000),
  validate(emailVerificationRequestSchema),
  asyncHandler(authController.handleSendForgotPassword)
);

// Reset password directly with email and new password
authRouter.patch(
  '/forgot-password',
  authIpLimit('reset-password', 10),
  validate(resetPasswordSchema),
  asyncHandler(authController.handleResetPassword)
);

export default authRouter;
