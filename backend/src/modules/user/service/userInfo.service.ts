import prismaClient from '../../../core/config/prisma';
import { account_status, account_role, user } from '@prisma/client';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import bcrypt from 'bcrypt';
import {
  isStrongPassword,
  strongPasswordMessage
} from '../../../core/utils/passwordPolicy';

const validatePhone = (phone?: string) => {
  const trimmedPhone = phone?.trim();

  if (!trimmedPhone) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Phone number is required');
  }

  if (!/^\d{10}$/.test(trimmedPhone)) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Phone number must contain exactly 10 digits'
    );
  }

  return trimmedPhone;
};

const validateDob = (dob?: string) => {
  if (!dob) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Date of birth is required');
  }

  const parsedDob = new Date(dob);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(parsedDob.getTime()) || parsedDob >= today) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Date of birth must be before today'
    );
  }

  return parsedDob;
};

export const setupProfile = async (
  user: user,
  data: {
    role: account_role;
    dob?: string;
    phone?: string;
    gender?: string;
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

  const phone = validatePhone(data.phone);
  const dob = validateDob(data.dob);

  if (data.role === account_role.STUDENT && !data.universityId) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'University is required for students'
    );
  }

  if (data.universityId && data.role === account_role.STUDENT) {
    const university = await prismaClient.university.findUnique({
      where: { id: data.universityId }
    });
    if (!university) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'University not found');
    }
  }

  const updatedUser = await prismaClient.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: user.id },
      include: {
        student: true,
        hosts: true
      }
    });

    if (!currentUser) {
      throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
    }

    const canRunSetup =
      currentUser.status === account_status.SET_UP ||
      (currentUser.status === account_status.ACTIVE &&
        currentUser.role === account_role.USER);

    if (!canRunSetup) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'User profile is already set up or locked'
      );
    }

    const userUpdated = await tx.user.update({
      where: { id: user.id },
      data: {
        role: data.role,
        dob,
        phone,
        gender: data.gender || null,
        status: account_status.ACTIVE
      }
    });

    if (data.role === account_role.STUDENT) {
      await tx.student.upsert({
        where: { studentId: user.id },
        update: { universityId: data.universityId },
        create: { studentId: user.id, universityId: data.universityId }
      });
    } else if (data.role === account_role.HOST) {
      await tx.host.upsert({
        where: { hostId: user.id },
        update: {},
        create: { hostId: user.id }
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

  if (data.universityId && user.role === account_role.STUDENT) {
    const university = await prismaClient.university.findUnique({
      where: { id: data.universityId }
    });
    if (!university) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'University not found');
    }
  }

  const phone =
    data.phone === undefined ? undefined : validatePhone(data.phone);
  const dob = data.dob === undefined ? undefined : validateDob(data.dob);

  const updatedUser = await prismaClient.$transaction(async (tx) => {
    const userUpdated = await tx.user.update({
      where: { id: user.id },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(phone && { phone }),
        ...(data.gender && { gender: data.gender }),
        ...(dob && { dob }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl })
      }
    });

    if (data.universityId && user.role === account_role.STUDENT) {
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

  if (!isStrongPassword(newPassword)) {
    throw new AppError(HttpStatus.BAD_REQUEST, strongPasswordMessage);
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

  await prismaClient.$transaction([
    prismaClient.user.update({
      where: { id: user.id },
      data: { hashedPassword: bcrypt.hashSync(newPassword, 10) }
    }),
    prismaClient.session.deleteMany({ where: { userId: user.id } })
  ]);
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
      role: true,
      createdAt: true,
      hosts: true,
      hostReviewsReceived: {
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true
            }
          }
        }
      },
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

  return {
    ...targetUser,
    roles: [targetUser.role],
    reviews: targetUser.hostReviewsReceived
  };
};

export const createHostReview = async (
  currentUser: user,
  hostId: string,
  data: {
    rating?: number;
    comment?: string;
  }
) => {
  const targetHostId = hostId.trim();
  const rating = Number(data.rating);
  const comment = data.comment?.trim();

  if (!targetHostId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'hostId is required');
  }

  if (currentUser.id === targetHostId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'You cannot review yourself');
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Rating must be from 1 to 5');
  }

  if (!comment) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Comment is required');
  }

  const hostUser = await prismaClient.user.findUnique({
    where: { id: targetHostId },
    include: { hosts: true }
  });

  if (!hostUser || hostUser.role !== account_role.HOST) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Host not found');
  }

  return prismaClient.$transaction(async (tx) => {
    const review = await tx.host_review.upsert({
      where: {
        reviewerId_hostId: {
          reviewerId: currentUser.id,
          hostId: targetHostId
        }
      },
      update: {
        rating,
        comment,
        updatedAt: new Date()
      },
      create: {
        rating,
        comment,
        reviewerId: currentUser.id,
        hostId: targetHostId
      },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    const aggregate = await tx.host_review.aggregate({
      where: { hostId: targetHostId },
      _avg: { rating: true }
    });

    await tx.host.updateMany({
      where: { hostId: targetHostId },
      data: {
        avgStar: aggregate._avg.rating ?? -1
      }
    });

    return review;
  });
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
