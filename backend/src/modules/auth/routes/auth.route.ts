import { NextFunction, Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
import * as authController from '../controllers/authenticate.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import config from '../../../core/config/config';

const authRouter = Router();

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
authRouter.post('/register', asyncHandler(authController.handleRegister));

// Authenticate with email & password
authRouter.post(
  '/login',
  verifyAuthCookieOrigin,
  asyncHandler(authController.handleLogin)
);

// Authenticate with Google ID token
authRouter.post(
  '/login/google',
  verifyAuthCookieOrigin,
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
  asyncHandler(authController.handleSendEmailVerification)
);

// Verify OTP code and complete verification
authRouter.patch(
  '/email-verification',
  asyncHandler(authController.handleVerifyEmail)
);

// -- Forgot Password --

// Send password reset link
authRouter.post(
  '/forgot-password',
  asyncHandler(authController.handleSendForgotPassword)
);

// Reset password directly with email and new password
authRouter.patch(
  '/forgot-password',
  asyncHandler(authController.handleResetPassword)
);

export default authRouter;
