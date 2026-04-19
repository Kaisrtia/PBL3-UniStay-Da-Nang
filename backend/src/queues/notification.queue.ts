import { Queue } from 'bullmq';
import { connection } from '../core/config/redis.connection';

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
