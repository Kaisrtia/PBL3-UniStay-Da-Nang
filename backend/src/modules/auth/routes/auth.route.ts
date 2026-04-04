import { Router } from 'express';
import * as authController from '../controllers/authenticate.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';

const authRouter = Router();

// -- Authentication --

// Create a new user account
authRouter.post('/register', asyncHandler(authController.handleRegister));

// Authenticate with email & password
authRouter.post('/login', asyncHandler(authController.handleLogin));

// Authenticate with Google ID token
authRouter.post(
  '/login/google',
  asyncHandler(authController.handleGoogleLogin)
);

// -- Sessions --

// Destroy the current session (logout)
authRouter.delete(
  '/sessions',
  asyncHandler(authController.handleDeleteSession)
);

// Refresh the access token
authRouter.post(
  '/sessions/refresh',
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

export default authRouter;
