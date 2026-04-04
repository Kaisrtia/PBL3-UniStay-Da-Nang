import prismaClient from '../../../core/config/prisma';
import { account_status, account_role } from '@prisma/client';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';

export const setupProfile = async (
  userId: string,
  data: {
    role: account_role;
    gender?: string;
    dob?: string;
    phone?: string;
    avatarUrl?: string;
  }
) => {
  if (!data.role || !Object.values(account_role).includes(data.role)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid or missing role');
  }

  // Check if phone is already used by another user
  if (data.phone) {
    const existingPhone = await prismaClient.user.findFirst({
      where: { phone: data.phone, id: { not: userId } }
    });
    if (existingPhone) {
      throw new AppError(HttpStatus.CONFLICT, 'Phone number is already in use');
    }
  }

  const user = await prismaClient.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }

  if (user.status !== account_status.SET_UP) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'User profile is already set up or locked');
  }

  const updatedUser = await prismaClient.user.update({
    where: { id: userId },
    data: {
      roles: [data.role],
      gender: data.gender,
      dob: data.dob ? new Date(data.dob) : null,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      status: account_status.ACTIVE
    }
  });

  return updatedUser;
};
