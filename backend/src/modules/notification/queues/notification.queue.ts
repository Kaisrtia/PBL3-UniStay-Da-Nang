import { Queue } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';

// Notification queues for post censoring results (automated and manual)
const censorAutomaticalNotificationQueue = new Queue(
  'censor-post-notification-queue',
  {
    connection
  }
);

const censorManualNotificationQueue = new Queue(
  'censor-manual-notification-queue',
  {
    connection
  }
);

export const addCensorPostNotificationJob = async (name: string, data: any) => {
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
};

// Request notification queue for accommodation requests
const requestSharedAccommodationNotificationQueue = new Queue(
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
      backoff: {
        type: 'exponential',
        delay: 3000
      }
    }
  );
};

// Comment notification queue
const commentNotificationQueue = new Queue(
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
