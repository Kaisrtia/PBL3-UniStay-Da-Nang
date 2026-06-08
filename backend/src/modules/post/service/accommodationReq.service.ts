import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { Prisma, user } from '@prisma/client';
import { requirePost } from '../utils/post.helper';
import { addRequestSharedAccommodationNotificationJob } from '../../notification/queues/notification.queue';
import * as blockService from '../../user/service/block.service';

export const createAccommodationRequest = async (
  currentUser: user,
  postId: string
) => {
  const post = await requirePost(postId);

  if (post.userId === currentUser.id) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'You cannot request your own post'
    );
  }

  if (await blockService.areUsersBlocked(currentUser.id, post.userId)) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      'You cannot send a request because one of you has blocked the other user'
    );
  }

  const existing = await prismaClient.accomodation_request.findUnique({
    where: { postId_userId: { postId, userId: currentUser.id } }
  });

  if (existing) {
    throw new AppError(
      HttpStatus.CONFLICT,
      'You have already submitted a request for this post'
    );
  }

  let request;
  try {
    request = await prismaClient.accomodation_request.create({
      data: { postId, userId: currentUser.id }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new AppError(
        HttpStatus.CONFLICT,
        'You have already submitted a request for this post'
      );
    }
    throw error;
  }

  addRequestSharedAccommodationNotificationJob(postId, post.userId).catch(
    (err) => {
      console.error(
        'Error enqueueing accommodation request notification job:',
        err
      );
    }
  );

  return request;
};

export const getReceivedAccommodationRequests = async (
  currentUser: user,
  page = 1,
  limit = 30
) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 60);
  const skip = (safePage - 1) * safeLimit;
  const blockedUserIds = await blockService.getBlockedUserIds(currentUser.id);
  const where = {
    post: {
      userId: currentUser.id
    },
    ...(blockedUserIds.length > 0 && {
      userId: {
        notIn: blockedUserIds
      }
    })
  };

  const [requests, total] = await Promise.all([
    prismaClient.accomodation_request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            postPurpose: true,
            roomType: true,
            price: true,
            detailAddress: true,
            ward: true,
            postImages: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            dob: true,
            gender: true,
            avatarUrl: true,
            student: {
              include: {
                university: true
              }
            }
          }
        }
      }
    }),
    prismaClient.accomodation_request.count({ where })
  ]);

  return {
    data: requests,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    }
  };
};

export const getSentAccommodationRequests = async (
  currentUser: user,
  page = 1,
  limit = 30
) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 60);
  const skip = (safePage - 1) * safeLimit;
  const blockedUserIds = await blockService.getBlockedUserIds(currentUser.id);
  const where = {
    userId: currentUser.id,
    ...(blockedUserIds.length > 0 && {
      post: {
        userId: {
          notIn: blockedUserIds
        }
      }
    })
  };

  const [requests, total] = await Promise.all([
    prismaClient.accomodation_request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
      include: {
        post: {
          include: {
            ward: true,
            postImages: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                avatarUrl: true,
                hosts: true
              }
            }
          }
        }
      }
    }),
    prismaClient.accomodation_request.count({ where })
  ]);

  return {
    data: requests,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    }
  };
};
