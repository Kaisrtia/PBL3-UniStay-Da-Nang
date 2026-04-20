import { Worker, Job } from 'bullmq';
import { connection } from '../core/config/redis.connection';
import { createRequestSharedAccommodationNotification } from '../modules/notification/services/notification.service';

new Worker(
  'request-shared-accommodation-notification-queue',
  async (job: Job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const { postId, postOwnerId } = job.data;
    
    const notification = await createRequestSharedAccommodationNotification(
      postId, postOwnerId
    );
    
    if (!notification) return;

    const isOnline = await connection.sismember('online_users', postOwnerId);
    if (isOnline) {
      await connection.publish(
        `user_notif:${postOwnerId}`,
        JSON.stringify(notification)
      );
      console.log(`Job ${job.id} processed successfully`);
    }
  },
  {
    connection
  }
);
