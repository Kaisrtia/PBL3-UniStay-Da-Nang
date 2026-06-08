import { Request, Response, NextFunction } from 'express';
import prismaClient from '../config/prisma';
import jwt from 'jsonwebtoken';
import HttpStatus from 'http-status';
import config from '../config/config';
import { account_status } from '@prisma/client';

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ message: 'Cannot find access token!' });

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
    const user = await prismaClient.user.findUnique({
      where: {
        id: decoded.id
      }
    });
    if (!user) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'User not found!' });
    }

    if (
      user.status === account_status.BANNED ||
      user.status === account_status.LOCKED ||
      user.status === account_status.HIDDEN
    ) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'User account is not active!' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ message: 'Token expired or invalid!' });
  }
};

export const optionalVerifyToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
    const user = await prismaClient.user.findUnique({
      where: {
        id: decoded.id
      }
    });

    if (
      user &&
      user.status !== account_status.BANNED &&
      user.status !== account_status.LOCKED &&
      user.status !== account_status.HIDDEN
    ) {
      req.user = user;
    }
  } catch {
    // Public endpoints should continue to work when an optional token is missing or stale.
  }

  next();
};
