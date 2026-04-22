import prismaClient from '../../../core/config/prisma';
import { account_status, provider } from '@prisma/client';
import HttpStatus from 'http-status';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto, { randomUUID } from 'crypto';
import { AppError } from '../../../core/exceptions/AppError';
import config from '../../../core/config/config';

const generateAccessToken = (user: any) => {
  return jwt.sign(
    { id: user.id, roles: user.roles },
    config.jwt.secret,
    { expiresIn: Number(config.jwt.access_token_ttl) }
  );
};

const generateAuthTokens = async (user: any) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = crypto.randomBytes(64).toString('hex');

  await prismaClient.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + Number(config.jwt.refresh_token_ttl))
    }
  });

  return { accessToken, refreshToken };
};

export const signUp = async (
  email?: string,
  password?: string,
  fullName?: string
) => {
  if (!email) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email is required');
  }
  if (!password) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Password is required');
  }
  if (!fullName) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Full name is required');
  }

  const checkUserEmail = await prismaClient.user.findUnique({
    where: {
      email
    }
  });
  if (checkUserEmail) {
    throw new AppError(HttpStatus.CONFLICT, 'Email already exists');
  }

  await prismaClient.$transaction([
    prismaClient.user.create({
      data: {
        id: randomUUID(),
        email,
        hashedPassword: bcrypt.hashSync(password, 10),
        fullName,
        provider: provider.SYSTEM
      }
    }),
    prismaClient.email_verification.create({
      data: { email }
    })
  ]);
};

export const login = async (email?: string, password?: string) => {
  if (!password) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Password is required');
  }
  if (!email) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email is required');
  }

  const user = await prismaClient.user.findUnique({
    where: {
      email
    }
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }

  // Check for verified email after verifying the password to prevent user enumeration attacks
  if (!user.emailVerified) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Email not verified');
  }

  if (user.provider === provider.GOOGLE) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      'User is registered with Google, please login with Google'
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.hashedPassword!);
  if (!isPasswordValid) {
    if (user.status?.includes('BANNED')) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'User is banned');
    } else {
      if (email) {
        throw new AppError(
          HttpStatus.UNAUTHORIZED,
          'Invalid email or password'
        );
      } else {
        throw new AppError(
          HttpStatus.UNAUTHORIZED,
          'Invalid phone or password'
        );
      }
    }
  }

  const tokens = await generateAuthTokens(user);
  return { ...tokens, user };
};

export const googleLogin = async (
  email?: string,
  fullName?: string,
  avatarUrl?: string
) => {
  if (!email) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email is required');
  }
  if (!fullName) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Full name is required');
  }
  let user = await prismaClient.user.findUnique({
    where: {
      email
    }
  });
  if (!user) {
    user = await prismaClient.user.create({
      data: {
        id: randomUUID(),
        email,
        fullName,
        avatarUrl,
        status: account_status.SET_UP,
        emailVerified: true,
        provider: provider.GOOGLE
      }
    });
  }

  const tokens = await generateAuthTokens(user);
  return { ...tokens, user };
};

export const logout = async (refreshToken: string) => {
  const session = await prismaClient.session.findUnique({
    where: {
      token: refreshToken
    }
  });
  if (!session) {
    return;
  }
  await prismaClient.session.delete({
    where: {
      token: refreshToken
    }
  });
};

export const refreshToken = async (refreshToken: string) => {
  const session = await prismaClient.session.findUnique({
    where: {
      token: refreshToken
    }
  });

  if (!session) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Refresh token is required');
  }

  if (session.expiresAt <= new Date()) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Refresh token is expired');
  }

  const user = await prismaClient.user.findUnique({
    where: {
      id: session.userId
    }
  });

  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'User not found');
  }

  return generateAccessToken(user);
};
