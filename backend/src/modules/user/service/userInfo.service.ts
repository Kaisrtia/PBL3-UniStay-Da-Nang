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
    universityId?: string;
  }
) => {
  if (
    !data.role ||
    (data.role !== account_role.STUDENT && data.role !== account_role.HOST)
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Invalid or missing role. Must be either STUDENT or HOST'
    );
  }

  if (data.role === account_role.STUDENT && data.universityId) {
    const university = await prismaClient.university.findUnique({
      where: { id: data.universityId }
    });
    if (!university) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'University not found');
    }
  }

  const updatedUser = await prismaClient.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: user.id }
    });

    if (!currentUser || currentUser.status !== account_status.SET_UP) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'User profile is already set up or locked'
      );
    }

    const userUpdated = await tx.user.update({
      where: { id: user.id },
      data: {
        roles: Array.from(new Set([...currentUser.roles, data.role])),
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : null,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        status: account_status.ACTIVE
      }
    });

    if (data.role === account_role.STUDENT) {
      await tx.student.create({
        data: {
          studentId: user.id,
          ...(data.universityId && { universityId: data.universityId })
        }
      });
    } else if (data.role === account_role.HOST) {
      await tx.host.create({
        data: {
          hostId: user.id
        }
      });
    }

    return userUpdated;
  });

  return updatedUser;
};

export const updateProfile = async (
  user: user,
  data: {
    fullName?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    avatarUrl?: string;
    universityId?: string;
  }
) => {
  if (
    !data.fullName &&
    !data.phone &&
    !data.dob &&
    !data.gender &&
    !data.avatarUrl &&
    !data.universityId
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'At least one field is required to update'
    );
  }

  if (data.universityId && user.roles.includes(account_role.STUDENT)) {
    const university = await prismaClient.university.findUnique({
      where: { id: data.universityId }
    });
    if (!university) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'University not found');
    }
  }

  const updatedUser = await prismaClient.$transaction(async (tx) => {
    const userUpdated = await tx.user.update({
      where: { id: user.id },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.phone && { phone: data.phone }),
        ...(data.gender && { gender: data.gender }),
        ...(data.dob && { dob: new Date(data.dob) }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl })
      }
    });

    if (data.universityId && user.roles.includes(account_role.STUDENT)) {
      await tx.student.upsert({
        where: { studentId: user.id },
        update: { universityId: data.universityId },
        create: { studentId: user.id, universityId: data.universityId }
      });
    }

    return userUpdated;
  });

  return updatedUser;
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

  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.hashedPassword!
  );
  if (!isPasswordValid) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid current password');
  }

  await prismaClient.user.update({
    where: { id: user.id },
    data: { hashedPassword: bcrypt.hashSync(newPassword, 10) }
  });
};

export const getUserProfile = async (targetUserId: string) => {
  const targetUser = await prismaClient.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      dob: true,
      gender: true,
      avatarUrl: true,
      emailVerified: true,
      phoneVerified: true,
      provider: true,
      status: true,
      roles: true,
      createdAt: true,
      hosts: true,
      student: {
        include: {
          university: true
        }
      }
    }
  });

  if (!targetUser) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }

  return targetUser;
};

export const getVerificationCandidates = async (
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [paginatedData, totalCount] = await Promise.all([
    prismaClient.host.findMany({
      skip,
      take: limit,
      where: {
        isVerified: false,
        avgStar: {
          gte: 4.5
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            phone: true
          }
        }
      }
    }),
    prismaClient.host.count({
      where: {
        isVerified: false,
        avgStar: {
          gte: 4.5
        }
      }
    })
  ]);

  return {
    data: paginatedData,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};
