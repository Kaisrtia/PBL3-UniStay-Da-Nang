import prismaClient from '../../../core/config/prisma';
import { account_status, provider, type user as User } from '@prisma/client';
import HttpStatus from 'http-status';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AppError } from '../../../core/exceptions/AppError';
import config from '../../../core/config/config';

const getUserRoles = (user: Pick<User, 'role'>) => [user.role];

const hashRefreshToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const createRefreshToken = () => randomBytes(64).toString('hex');

const getRefreshTokenExpiresAt = () =>
  new Date(Date.now() + config.jwt.refresh_token_ttl_seconds * 1000);

const generateAccessToken = (user: Pick<User, 'id' | 'role'>) => {
  return jwt.sign(
    { id: user.id, roles: getUserRoles(user) },
    config.jwt.secret,
    { expiresIn: config.jwt.access_token_ttl_seconds }
  );
};

const generateAuthTokens = async (user: Pick<User, 'id' | 'role'>) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = createRefreshToken();
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

  await prismaClient.$transaction([
    prismaClient.session.deleteMany({
      where: { expiresAt: { lte: new Date() } }
    }),
    prismaClient.session.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: refreshTokenExpiresAt
      }
    })
  ]);

  return { accessToken, refreshToken, refreshTokenExpiresAt };
};

export const signUp = async (
  email?: string,
  password?: string,
  fullName?: string
) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedFullName = fullName?.trim();

  if (!normalizedEmail) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email is required');
  }
  if (!password) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Password is required');
  }
  if (!normalizedFullName) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Full name is required');
  }

  const checkUserEmail = await prismaClient.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });
  if (checkUserEmail) {
    throw new AppError(HttpStatus.CONFLICT, 'Email already exists');
  }

  await prismaClient.$transaction([
    prismaClient.user.create({
      data: {
        id: randomUUID(),
        email: normalizedEmail,
        hashedPassword: bcrypt.hashSync(password, 10),
        fullName: normalizedFullName,
        provider: provider.SYSTEM
      }
    }),
    prismaClient.email_verification.upsert({
      where: { email: normalizedEmail },
      update: { code: null, expiresAt: null },
      create: { email: normalizedEmail }
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

  if (user.status === account_status.BANNED) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'User is banned');
  }

  if (
    user.status !== account_status.ACTIVE &&
    user.status !== account_status.SET_UP
  ) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Account is not active');
  }

  const isPasswordValid = await bcrypt.compare(password, user.hashedPassword!);
  if (!isPasswordValid) {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const tokens = await generateAuthTokens(user);
  return { ...tokens, user: { ...user, roles: getUserRoles(user) } };
};

export const googleLogin = async (
  email?: string,
  fullName?: string,
  avatarUrl?: string
) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedFullName = fullName?.trim();

  if (!normalizedEmail) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Email is required');
  }
  if (!normalizedFullName) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Full name is required');
  }
  let user = await prismaClient.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });
  if (user) {
    if (user.provider !== provider.GOOGLE) {
      throw new AppError(
        HttpStatus.CONFLICT,
        'Email is already registered with password login'
      );
    }

    if (user.status === account_status.BANNED) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'User is banned');
    }

    if (
      !user.emailVerified ||
      (user.status !== account_status.ACTIVE &&
        user.status !== account_status.SET_UP)
    ) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Account is not active');
    }
  } else {
    user = await prismaClient.user.create({
      data: {
        id: randomUUID(),
        email: normalizedEmail,
        fullName: normalizedFullName,
        avatarUrl,
        status: account_status.SET_UP,
        emailVerified: true,
        provider: provider.GOOGLE
      }
    });
  }

  const tokens = await generateAuthTokens(user);
  return { ...tokens, user: { ...user, roles: getUserRoles(user) } };
};

export const logout = async (refreshToken: string) => {
  await prismaClient.session.deleteMany({
    where: { tokenHash: hashRefreshToken(refreshToken) }
  });
};

export const refreshToken = async (refreshToken: string) => {
  const currentTokenHash = hashRefreshToken(refreshToken);
  const rotatedRefreshToken = createRefreshToken();
  const rotatedTokenHash = hashRefreshToken(rotatedRefreshToken);

  const result = await prismaClient.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: { tokenHash: currentTokenHash },
      include: { user: true }
    });

    if (!session) {
      return { status: 'INVALID' as const };
    }

    if (session.expiresAt <= new Date()) {
      await tx.session.delete({ where: { id: session.id } });
      return { status: 'EXPIRED' as const };
    }

    if (
      session.user.status !== account_status.ACTIVE &&
      session.user.status !== account_status.SET_UP
    ) {
      await tx.session.deleteMany({ where: { userId: session.userId } });
      return { status: 'INACTIVE' as const };
    }

    const rotated = await tx.session.updateMany({
      where: {
        id: session.id,
        tokenHash: currentTokenHash
      },
      data: {
        tokenHash: rotatedTokenHash
      }
    });

    if (rotated.count !== 1) {
      return { status: 'INVALID' as const };
    }

    return {
      status: 'OK' as const,
      accessToken: generateAccessToken(session.user),
      refreshToken: rotatedRefreshToken,
      refreshTokenExpiresAt: session.expiresAt
    };
  });

  if (result.status === 'EXPIRED') {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Refresh token is expired');
  }

  if (result.status === 'INACTIVE') {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'User account is not active');
  }

  if (result.status !== 'OK') {
    throw new AppError(HttpStatus.UNAUTHORIZED, 'Refresh token is invalid');
  }

  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    refreshTokenExpiresAt: result.refreshTokenExpiresAt
  };
};
