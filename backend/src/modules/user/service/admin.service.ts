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

export const verifyHost = async (admin: user, hostId: string) => {
  const host = await prismaClient.host.findUnique({
    where: { hostId }
  });

  if (!host) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Host not found');
  }

  if (host.isVerified) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Host is already verified');
  }

  if (host.avgStar.toNumber() < 4.5) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Host does not meet the minimum rating requirement (>= 4.5)'
    );
  }

  const evaluationCount = await prismaClient.student_evaluate_host.count({
    where: { hostId }
  });

  if (evaluationCount <= 20) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Host has not received enough evaluations (> 20). Currently has ${evaluationCount}.`
    );
  }

  return prismaClient.host.update({
    where: { hostId },
    data: { isVerified: true }
  });
};

export const getAllUsers = async (admin: user, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [users, totalCount] = await Promise.all([
    prismaClient.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        status: true,
        roles: true,
        createdAt: true
      }
    }),
    prismaClient.user.count()
  ]);

  return {
    data: users,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};