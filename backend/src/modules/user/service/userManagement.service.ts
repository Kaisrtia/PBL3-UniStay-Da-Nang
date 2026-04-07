import prismaClient from '../../../core/config/prisma';
import { account_status, user } from '@prisma/client';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';

export const banUser = async (admin: user, userId: string) => {
  const target = await prismaClient.user.findUnique({ where: { id: userId } });

  if (!target) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }

  if (target.status === account_status.BANNED) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'User is already banned');
  }

  await prismaClient.user.update({
    where: { id: userId },
    data: { status: account_status.BANNED }
  });
};

export const unbanUser = async (admin: user, userId: string) => {
  const target = await prismaClient.user.findUnique({ where: { id: userId } });

  if (!target) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }

  if (target.status !== account_status.BANNED) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'User is not banned');
  }

  await prismaClient.user.update({
    where: { id: userId },
    data: { status: account_status.ACTIVE }
  });
};