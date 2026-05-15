import { notification_type, post, post_status } from '@prisma/client';
import prismaClient from '../../../core/config/prisma';
import { AppError } from '../../../core/exceptions/AppError';
import HttpStatus from 'http-status';

export const getUserNotifications = async (
  userId: string,
  page = 1,
  limit = 20
) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const skip = (safePage - 1) * safeLimit;

  const [notifications, total] = await Promise.all([
    prismaClient.notification.findMany({
      where: { userId },
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: safeLimit
    }),
    prismaClient.notification.count({ where: { userId } })
  ]);

  return {
    data: notifications,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    }
  };
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: number
) => {
  const notification = await prismaClient.notification.findFirst({
    where: { id: notificationId, userId }
  });

  if (!notification) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Không tìm thấy thông báo.');
  }

  return prismaClient.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      updatedAt: new Date()
    }
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  return prismaClient.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      updatedAt: new Date()
    }
  });
};

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

  const title = status === post_status.REJECTED
    ? 'Bài đăng của bạn chưa được duyệt'
    : 'Bài đăng của bạn đã được duyệt';
  const content = status === post_status.REJECTED
    ? `Bài đăng "${post.title}" chưa được duyệt. Lý do: ${rejectionReason}.`
    : `Bài đăng "${post.title}" đã được duyệt và hiển thị trên hệ thống.`;

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
    content = `${requests[0].user.fullName} đã gửi yêu cầu thuê hoặc ở ghép bài đăng của bạn.`;
  } else if (count === 2) {
    content = `${requests[0].user.fullName} và ${requests[1].user.fullName} đã gửi yêu cầu thuê hoặc ở ghép bài đăng của bạn.`;
  } else {
    const first = requests[0].user.fullName;
    content = `${first} và ${count - 1} người khác đã gửi yêu cầu thuê hoặc ở ghép bài đăng của bạn.`;
  }

  const title = count === 1
    ? 'Có 1 yêu cầu thuê mới'
    : `Có ${count} yêu cầu thuê mới`;

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
    namesString = `${distinctUsers[0]} và ${distinctUsers[1]}`;
  } else {
    namesString = `${distinctUsers[0]} và ${count - 1} người khác`;
  }

  let title: string;
  let content: string | null = null;

  if (isReply) {
    // Title: Your comment on post {post title} by {poster name} just received a reply from A
    // Note: {poster name} refers to the post owner's name
    title = `Bình luận của bạn trong bài "${currentComment.post.title}" vừa có phản hồi từ ${namesString}`;
  } else {
    // Title: Your post {post title} just received a notification
    title = `Bài đăng "${currentComment.post.title}" vừa có bình luận mới`;
    
    // Content: A just commented on your post / A and B have commented on your post
    if (count === 1) {
      content = `${namesString} vừa bình luận trong bài đăng của bạn.`;
    } else {
      content = `${namesString} vừa bình luận trong bài đăng của bạn.`;
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
