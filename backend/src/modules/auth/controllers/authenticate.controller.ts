import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as authService from '../services/authenticate.service';
import {
  sendEmailOtpCode,
  verifyEmailOtpCode,
  sendPasswordResetLink,
  resetPasswordWithToken
} from '../services/email.service';
import oauth2Client from '../../../core/config/oauth2Client';
import { AppError } from '../../../core/exceptions/AppError';
import { sendSuccess } from '../../../core/utils/response.handler';
import config from '../../../core/config/config';
import { toUserResponseDto } from '../../user/dto/user-response.dto';

// Auth Handlers

export const handleRegister = async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;
  await authService.signUp(email, password, fullName);
  sendSuccess(
    res,
    HttpStatus.CREATED,
    null,
    'Registration successful. Please verify your email to continue.'
  );
};

export const handleLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  sendSuccess(res, HttpStatus.OK, {
    accessToken: result.accessToken,
    user: toUserResponseDto(result.user)
  });
};

export const handleGoogleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const ticket = await oauth2Client.verifyIdToken({
    idToken,
    audience: config.google.client_id
  });
  const payload = ticket.getPayload();

  if (!payload) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid Google token');
  }

  const result = await authService.googleLogin(
    payload.email,
    payload.name,
    payload.picture
  );

  sendSuccess(res, HttpStatus.OK, {
    accessToken: result.accessToken,
    user: toUserResponseDto(result.user)
  });
};

// Email Verification Handlers

export const handleSendEmailVerification = async (req: Request, res: Response) => {
  const { email } = req.body;
  await sendEmailOtpCode(email);
  sendSuccess(res, HttpStatus.OK, null, 'Verification code sent to your email');
};

export const handleVerifyEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  await verifyEmailOtpCode(email, code);
  sendSuccess(res, HttpStatus.OK, null, 'Email verified successfully');
};

// Forgot Password Handlers

export const handleSendForgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  await sendPasswordResetLink(email);
  sendSuccess(res, HttpStatus.OK, null, 'Password reset link sent to your email');
};

export const handleResetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  await resetPasswordWithToken(token, newPassword);
  sendSuccess(res, HttpStatus.OK, null, 'Password reset successfully');
};
