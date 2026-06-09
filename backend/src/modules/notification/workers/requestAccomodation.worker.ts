import { Worker, Job } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import { createRequestSharedAccommodationNotification } from '../services/notification.service';
import { pushNotificationIfOnline } from '../utils/pushNotification';

export const accommodationNotificationWorker = new Worker(
  'request-shared-accommodation-notification-queue',
  async (job: Job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const { postId, postOwnerId } = job.data;
    
    const notification = await createRequestSharedAccommodationNotification(
      postId, postOwnerId
    );
    
    if (!notification) return;

    const sent = await pushNotificationIfOnline(postOwnerId, notification);
    if (sent) {
      console.log(`Job ${job.id} processed successfully`);
    }
  },
  {
    connection
  }
);
