import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { user } from '@prisma/client';
import { requirePost } from '../utils/post.helper';
import { addRequestSharedAccommodationNotificationJob } from '../../notification/queues/notification.queue';

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

  const existing = await prismaClient.accomodation_request.findUnique({
    where: { postId_userId: { postId, userId: currentUser.id } }
  });

  if (existing) {
    throw new AppError(
      HttpStatus.CONFLICT,
      'You have already submitted a request for this post'
    );
  }

  const request = await prismaClient.accomodation_request.create({
    data: { postId, userId: currentUser.id }
  });

  await addRequestSharedAccommodationNotificationJob(postId, post.userId);

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
  const where = {
    post: {
      userId: currentUser.id
    }
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
  const where = {
    userId: currentUser.id
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
