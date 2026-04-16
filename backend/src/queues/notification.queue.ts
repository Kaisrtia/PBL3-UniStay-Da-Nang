import { Queue } from 'bullmq';
import { connection } from '../core/config/redis.connection';

export const notificationQueue = new Queue('censor-post-notification-queue', {
  connection
});

export const addCensorPostNotificationJob = async (name: string, data: any) => {
  return await notificationQueue.add(name, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000
    }
  });
};