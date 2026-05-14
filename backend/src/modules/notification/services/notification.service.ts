import { notification_type, post, post_status } from '@prisma/client';
import prismaClient from '../../../core/config/prisma';
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
  const user = await prismaClient.user.findUnique({
    where: {
      id: userId
    }
  });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
  }
  const post = await prismaClient.post.findUnique({
    where: {
      id: postId
    }
  });
  if (!post) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Post not found');
  }

  const title = `Your post with id ${postId} was ${status === post_status.REJECTED ? 'rejected' : 'approved'} by system`;
  const content = `Your post: ${post.title} was ${status === post_status.REJECTED ? 'rejected' : 'approved'}. ${status === post_status.REJECTED ? 'The reason is: ' + rejectionReason : 'Your post is now live on our platform.'}`;

  const existingNotifs = await prismaClient.notification.findMany({
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
    return await prismaClient.notification.update({
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

  return await prismaClient.notification.create({
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
  postId: string,
  postOwnerId: string
) => {
  // 1. Fetch all PENDING requesters for this post
  const requests = await prismaClient.accomodation_request.findMany({
    where: { postId, status: 'PENDING' },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: 'asc' }
  });

  if (requests.length === 0) return null;

  // 2. Build grouped message
  const count = requests.length;
  let content: string;
  if (count === 1) {
    content = `${requests[0].user.fullName} has requested to share accommodation with your post.`;
  } else if (count === 2) {
    content = `${requests[0].user.fullName} and ${requests[1].user.fullName} have requested to share accommodation with your post.`;
  } else {
    const first = requests[0].user.fullName;
    content = `${first} and ${count - 1} others have requested to share accommodation with your post.`;
  }

  const title = count === 1
    ? '1 new accommodation request'
    : `${count} new accommodation requests`;

  // 3. Find existing notification
  const existingNotifs = await prismaClient.notification.findMany({
    where: {
      type: notification_type.ACCOMODATION_REQUEST,
      userId: postOwnerId,
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
    return await prismaClient.notification.update({
      where: { id: existingNoti.id },
      data: {
        title,
        content,
        isRead: false,
        updatedAt: new Date(),
        metaData: {
          ...((existingNoti.metaData as any) || {}),
          postId,
          requestCount: count,
          requesterIds: requests.map(r => r.userId)
        }
      }
    });
  }

  return await prismaClient.notification.create({
    data: {
      title,
      content,
      type: notification_type.ACCOMODATION_REQUEST,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metaData: {
        postId,
        requestCount: count,
        requesterIds: requests.map(r => r.userId)
      },
      user: {
        connect: { id: postOwnerId }
      }
    }
  });
};

export const createCommentNotification = async (
  commentId: string
) => {
  // Fetch the comment along with its user, the associated post, and parent comment
  const currentComment = await prismaClient.comment.findUnique({
    where: { id: commentId },
    include: {
      user: { select: { fullName: true } },
      post: { select: { title: true, userId: true, user: { select: { fullName: true } } } },
      comment: { select: { userId: true, user: { select: { fullName: true } } } } // parent comment
    }
  });

  if (!currentComment) return null;

  const isReply = !!currentComment.parentId;
  
  // Determine target user
  const targetUserId = isReply ? currentComment.comment!.userId : currentComment.post.userId;

  // Don't notify the user about their own comment
  if (currentComment.userId === targetUserId) {
    return null;
  }

  // Fetch all users who have commented on this post (if root) or replied to this parent (if reply),
  // excluding the target user
  const siblingComments = await prismaClient.comment.findMany({
    where: {
      postId: currentComment.postId,
      parentId: currentComment.parentId,
      userId: { not: targetUserId },
      status: 'DISPLAYED'
    },
    select: { user: { select: { fullName: true } } },
    orderBy: { createdAt: 'asc' }
  });

  // Group by distinct users
  const distinctUsers = Array.from(new Set(siblingComments.map(c => c.user.fullName)));
  
  if (distinctUsers.length === 0) return null;

  const count = distinctUsers.length;
  let namesString: string;
  if (count === 1) {
    namesString = distinctUsers[0];
  } else if (count === 2) {
    namesString = `${distinctUsers[0]} and ${distinctUsers[1]}`;
  } else {
    namesString = `${distinctUsers[0]} and ${count - 1} others`;
  }

  let title: string;
  let content: string | null = null;

  if (isReply) {
    // Title: Your comment on post {post title} by {poster name} just received a reply from A
    // Note: {poster name} refers to the post owner's name
    title = `Your comment on post ${currentComment.post.title} by ${currentComment.post.user.fullName} just received a reply from ${namesString}`;
  } else {
    // Title: Your post {post title} just received a notification
    title = `Your post ${currentComment.post.title} just received a notification`;
    
    // Content: A just commented on your post / A and B have commented on your post
    if (count === 1) {
      content = `${namesString} just commented on your post`;
    } else {
      content = `${namesString} have commented on your post`;
    }
  }

  // Check for existing notification
  const existingNotifs = await prismaClient.notification.findMany({
    where: {
      type: notification_type.COMMENT,
      userId: targetUserId,
      metaData: {
        path: isReply ? ['parentId'] : ['postId'],
        equals: isReply ? currentComment.parentId! : currentComment.postId
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // Filter exactly to make sure it's the right level
  const existingNoti = existingNotifs.find(n => {
     const meta = n.metaData as any;
     if (isReply) {
       return meta?.notificationLevel === 'REPLY' && meta?.parentId === currentComment.parentId;
     } else {
       return meta?.notificationLevel === 'ROOT' && meta?.postId === currentComment.postId;
     }
  });

  if (existingNoti) {
    return await prismaClient.notification.update({
      where: { id: existingNoti.id },
      data: {
        title,
        content,
        isRead: false,
        updatedAt: new Date(),
        metaData: {
          ...((existingNoti.metaData as any) || {}),
          commentId,
          postId: currentComment.postId,
          ...(isReply ? { parentId: currentComment.parentId } : {}),
          notificationLevel: isReply ? 'REPLY' : 'ROOT'
        }
      }
    });
  }

  return await prismaClient.notification.create({
    data: {
      title,
      content,
      type: notification_type.COMMENT,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metaData: {
        commentId,
        postId: currentComment.postId,
        ...(isReply ? { parentId: currentComment.parentId } : {}),
        notificationLevel: isReply ? 'REPLY' : 'ROOT'
      },
      user: {
        connect: { id: targetUserId }
      }
    }
  });
};
