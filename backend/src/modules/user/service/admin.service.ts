import prismaClient from '../../../core/config/prisma';
import { account_status } from '@prisma/client';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';

export const banUser = async (userId: string) => {
  const target = await prismaClient.user.findUnique({ where: { id: userId } });

  if (!target) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }

  if (target.status === account_status.BANNED) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'User is already banned');
  }

  await prismaClient.$transaction([
    prismaClient.user.update({
      where: { id: userId },
      data: { status: account_status.BANNED }
    }),
    prismaClient.session.deleteMany({
      where: { userId }
    })
  ]);
};

const getUnbannedStatus = async (userId: string) => {
  const [student, host] = await Promise.all([
    prismaClient.student.findUnique({ where: { studentId: userId } }),
    prismaClient.host.findUnique({ where: { hostId: userId } })
  ]);

  return student || host ? account_status.ACTIVE : account_status.SET_UP;
};

export const unbanUser = async (userId: string) => {
  const target = await prismaClient.user.findUnique({ where: { id: userId } });

  if (!target) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }

  if (target.status !== account_status.BANNED) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'User is not banned');
  }

  const restoredStatus = await getUnbannedStatus(userId);

  await prismaClient.user.update({
    where: { id: userId },
    data: { status: restoredStatus }
  });
};

export const verifyHost = async (hostId: string) => {
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

  return prismaClient.host.update({
    where: { hostId },
    data: { isVerified: true }
  });
};

export const getAllUsers = async (page: number = 1, limit: number = 10) => {
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
        role: true,
        createdAt: true
      }
    }),
    prismaClient.user.count()
  ]);

  return {
    data: users.map((user) => ({
      ...user,
      roles: [user.role]
    })),
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};
