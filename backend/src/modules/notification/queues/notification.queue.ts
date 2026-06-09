import { Queue } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import { post_status } from '@prisma/client';

// Notification queues for post censoring results (automated and manual)
export const censorAutomaticalNotificationQueue = new Queue(
  'censor-post-notification-queue',
  {
    connection
  }
);

export const censorManualNotificationQueue = new Queue(
  'censor-manual-notification-queue',
  {
    connection
  }
);

type CensorPostNotificationJobData = {
  automated_censoring: {
    notificationId: number;
  };
  manual_censoring: {
    postId: string;
    userId: string;
    status: post_status;
    rejectionReason?: string;
  };
};

export const addCensorPostNotificationJob = async <
  TName extends keyof CensorPostNotificationJobData
>(
  name: TName,
  data: CensorPostNotificationJobData[TName]
) => {
  if (name === 'automated_censoring') {
    return await censorAutomaticalNotificationQueue.add(name, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000
      }
    });
  } else if (name === 'manual_censoring') {
    return await censorManualNotificationQueue.add(name, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000
      }
    });
  }

  throw new Error(`Unsupported censor post notification job: ${name}`);
};

// Request notification queue for accommodation requests
export const requestSharedAccommodationNotificationQueue = new Queue(
  'request-shared-accommodation-notification-queue',
  {
    connection
  }
);

export const addRequestSharedAccommodationNotificationJob = async (
  postId: string,
  postOwnerId: string
) => {
  const jobId = `accom-notif-${postId}`;

  return await requestSharedAccommodationNotificationQueue.add(
    'request-shared-accommodation',
    { postId, postOwnerId },
    {
      jobId,
      delay: 30000,
      attempts: 3,
      removeOnComplete: true,
      removeOnFail: true,
      backoff: {
        type: 'exponential',
        delay: 3000
      }
    }
  );
};

// Comment notification queue
export const commentNotificationQueue = new Queue(
  'comment-notification-queue',
  {
    connection
  }
);

export const addCommentNotificationJob = async (
  commentId: string
) => {
  return await commentNotificationQueue.add(
    'comment-notification',
    { commentId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000
      }
    }
  );
};
