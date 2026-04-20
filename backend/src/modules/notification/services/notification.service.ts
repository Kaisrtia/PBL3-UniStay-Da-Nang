import { notification_type, post, post_status } from '@prisma/client';
import { prisma } from '../../../core/config/database';
import { AppError } from '../../../core/exceptions/AppError';
import HttpStatus from 'http-status';

export const createPostCensorNotification = async (
  userId: string,
  postId: string,
  status: post_status,
  rejectionReason?: string
) => {
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

  const title = `Your post with id ${postId} was ${status === post_status.REJECTED ? 'rejected' : 'approved'} by system`;
  const content = `Your post: ${post.title} was ${status === post_status.REJECTED ? 'rejected' : 'approved'}. ${status === post_status.REJECTED ? 'The reason is: ' + rejectionReason : 'Your post is now live on our platform.'}`;

  const existingNotifs = await prisma.notification.findMany({
    where: {
      type: notification_type.CENSOR_POST,
      userId: userId,
      metaData: {
        path: ['postId'],
        equals: postId
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  const existingNoti = existingNotifs[0];

  if (existingNoti) {
    return await prisma.notification.update({
      where: { id: existingNoti.id },
      data: {
        title,
        content,
        isRead: false,
        updatedAt: new Date(),
        metaData: {
          ...((existingNoti.metaData as any) || {}),
          postId
        }
      }
    });
  }

  return await prisma.notification.create({
    data: {
      title,
      content,
      type: notification_type.CENSOR_POST,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metaData: {
        postId
      },
      user: {
        connect: { id: userId }
      }
    }
  });
};

export const createRequestSharedAccommodationNotification = async (
  id: string,
  senderId: string,
  receiverId: string,
  postId: string,
  accommodationRequestId: string
) => {
  // Implementation for creating request shared accommodation notification
};
