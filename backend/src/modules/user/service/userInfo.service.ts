import prismaClient from '../../../core/config/prisma';
import { account_status, account_role, user } from '@prisma/client';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import bcrypt from 'bcrypt';

export const setupProfile = async (
  user: user,
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

  if (user.status !== account_status.SET_UP) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'User profile is already set up or locked');
  }

  if (data.phone) {
    const existingPhone = await prismaClient.user.findFirst({
      where: { phone: data.phone, id: { not: user.id } }
    });
    if (existingPhone) {
      throw new AppError(HttpStatus.CONFLICT, 'Phone number is already in use');
    }
  }

  return prismaClient.user.update({
    where: { id: user.id },
    data: {
      roles: Array.from(new Set([...user.roles, data.role])),
      gender: data.gender,
      dob: data.dob ? new Date(data.dob) : null,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      status: account_status.ACTIVE
    }
  });
};

export const updateProfile = async (
  user: user,
  data: {
    fullName?: string;
    dob?: string;
    gender?: string;
    avatarUrl?: string;
  }
) => {
  if (!data.fullName && !data.dob && !data.gender && !data.avatarUrl) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'At least one field is required to update');
  }

  return prismaClient.user.update({
    where: { id: user.id },
    data: {
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.gender && { gender: data.gender }),
      ...(data.dob && { dob: new Date(data.dob) }),
      ...(data.avatarUrl && { avatarUrl: data.avatarUrl })
    }
  });
};

export const changePassword = async (
  user: user,
  currentPassword: string,
  newPassword: string
) => {
  if (!currentPassword) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Current password is required');
  }

  if (!newPassword) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'New password is required');
  }

  if (user.provider === 'GOOGLE') {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Users logged in with Google cannot change password'
    );
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword!);
  if (!isPasswordValid) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid current password');
  }

  await prismaClient.user.update({
    where: { id: user.id },
    data: { hashedPassword: bcrypt.hashSync(newPassword, 10) }
  });
};