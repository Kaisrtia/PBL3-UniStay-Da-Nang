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
