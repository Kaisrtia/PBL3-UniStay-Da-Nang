import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as authService from '../services/authenticate.service';
import {
  sendEmailOtpCode,
  verifyEmailOtpCode
} from '../services/email.service';
import oauth2Client from '../../../core/config/oauth2Client';
import { AppError } from '../../../core/exceptions/AppError';
import { sendSuccess } from '../../../core/utils/response.handler';
import config from '../../../core/config/config';

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

  // Set HTTP-only cookie for refresh token
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: Number(config.jwt.refresh_token_ttl)
  });

  sendSuccess(res, HttpStatus.OK, {
    accessToken: result.accessToken,
    user: {
      id: result.user.id,
      email: result.user.email,
      phone: result.user.phone,
      fullName: result.user.fullName,
      status: result.user.status,
      roles: result.user.roles
    }
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

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: Number(config.jwt.refresh_token_ttl)
  });

  sendSuccess(res, HttpStatus.OK, {
    accessToken: result.accessToken,
    user: {
      id: result.user.id,
      email: result.user.email,
      phone: result.user.phone,
      fullName: result.user.fullName,
      status: result.user.status,
      roles: result.user.roles,
      avatarUrl: result.user.avatarUrl
    }
  });
};

export const handleDeleteSession = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Refresh token is required');
  }

  await authService.logout(refreshToken);
  res.clearCookie('refreshToken');
  res.status(HttpStatus.NO_CONTENT).send();
};

export const handleRefreshSession = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Refresh token is required');
  }

  const accessToken = await authService.refreshToken(refreshToken);
  sendSuccess(res, HttpStatus.OK, { accessToken });
};

// Email Verification Handlers

export const handleSendEmailVerification = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;
  await sendEmailOtpCode(email);
  sendSuccess(res, HttpStatus.OK, null, 'Verification code sent to your email');
};

export const handleVerifyEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  await verifyEmailOtpCode(email, code);
  sendSuccess(res, HttpStatus.OK, null, 'Email verified successfully');
};
