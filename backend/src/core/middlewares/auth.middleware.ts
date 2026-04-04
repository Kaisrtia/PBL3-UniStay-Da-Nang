import { Request, Response, NextFunction } from 'express';
import prismaClient from '../config/prisma';
import jwt from 'jsonwebtoken';
import HttpStatus from 'http-status';
import config from '../config/config';

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
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ message: 'Token expired or invalid!' });
  }
};
