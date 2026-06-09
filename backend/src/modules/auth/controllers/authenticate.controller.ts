import { CookieOptions, Request, Response } from 'express';
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

const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.node_env === 'production',
  sameSite: config.node_env === 'production' ? 'none' : 'lax',
  path: '/api/v1/auth/sessions'
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', refreshTokenCookieOptions);
};

const setRefreshTokenCookie = (
  res: Response,
  token: string,
  expiresAt: Date
) => {
  res.cookie('refreshToken', token, {
    ...refreshTokenCookieOptions,
    expires: expiresAt
  });
};

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

  setRefreshTokenCookie(
    res,
    result.refreshToken,
    result.refreshTokenExpiresAt
  );

  sendSuccess(res, HttpStatus.OK, {
    accessToken: result.accessToken,
    user: toUserResponseDto(result.user)
  });
};

export const handleGoogleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Google token is required');
  }

  let ticket;
  try {
    ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: config.google.client_id
    });
  } catch {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid Google token');
  }

  const payload = ticket.getPayload();

  if (!payload) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid Google token');
  }

  const result = await authService.googleLogin(
    payload.email,
    payload.name,
    payload.picture
  );

  setRefreshTokenCookie(
    res,
    result.refreshToken,
    result.refreshTokenExpiresAt
  );

  sendSuccess(res, HttpStatus.OK, {
    accessToken: result.accessToken,
    user: toUserResponseDto(result.user)
  });
};

export const handleDeleteSession = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  clearRefreshTokenCookie(res);
  res.status(HttpStatus.NO_CONTENT).send();
};

export const handleRefreshSession = async (req: Request, res: Response) => {
  const currentRefreshToken = req.cookies?.refreshToken;
  if (!currentRefreshToken) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Refresh token is required');
  }

  try {
    const tokens = await authService.refreshToken(currentRefreshToken);
    setRefreshTokenCookie(
      res,
      tokens.refreshToken,
      tokens.refreshTokenExpiresAt
    );
    sendSuccess(res, HttpStatus.OK, { accessToken: tokens.accessToken });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === HttpStatus.UNAUTHORIZED) {
      clearRefreshTokenCookie(res);
    }
    throw error;
  }
};

// Email Verification Handlers

export const handleSendEmailVerification = async (req: Request, res: Response) => {
  const { email } = req.body;
  await sendEmailOtpCode(email);
  sendSuccess(
    res,
    HttpStatus.OK,
    null,
    'If the account can be verified, a verification code has been sent.'
  );
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
  sendSuccess(
    res,
    HttpStatus.OK,
    null,
    'If the account is eligible, a password reset link has been sent.'
  );
};

export const handleResetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  await resetPasswordWithToken(token, newPassword);
  sendSuccess(res, HttpStatus.OK, null, 'Password reset successfully');
};
