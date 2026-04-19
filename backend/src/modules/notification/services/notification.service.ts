import { notification_type, post, post_status } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { AppError } from '../../../core/exceptions/AppError';
import HttpStatus from 'http-status';
import { randomUUID } from 'crypto';

export const createPostCensorNotification = async (
  id: string,
  userId: string,
  postId: string,
  status: post_status,
  rejectionReason?: string
) => {
  const noti = await prisma.notification.findUnique({
    where: {
      id
    }
  });
  if (noti) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Duplicated notification');
  }
  if (status !== post_status.APPROVED && status !== post_status.REJECTED) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid post status');
  }
  if (status === post_status.REJECTED && !rejectionReason) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Rejection reason is required for rejected posts'
    );
  }
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }
  const post = await prisma.post.findUnique({
    where: {
      id: postId
    }
  });
  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }
  return await prisma.notification.create({
    data: {
      id: id,
      title: `Your post with id ${postId} was ${status === post_status.REJECTED ? 'rejected' : 'approved'} by system`,
      content: `Your post: ${post.title} was ${status === post_status.REJECTED ? 'rejected' : 'approved'}. ${status === post_status.REJECTED ? 'The reason is: ' + rejectionReason : 'Your post is now live on our platform.'}`,
      type: notification_type.POST,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        connect: { id: post.userId }
      }
    }
  });
};
