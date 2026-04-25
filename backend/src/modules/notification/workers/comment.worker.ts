import { Worker, Job } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import { createCommentNotification } from '../services/notification.service';
import { pushNotificationIfOnline } from '../utils/pushNotification';

new Worker(
  'comment-notification-queue',
  async (job: Job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const { commentId } = job.data;
    
    const notification = await createCommentNotification(commentId);
    
    if (!notification) return;

    const sent = await pushNotificationIfOnline(notification.userId, notification);
    if (sent) {
      console.log(`Job ${job.id} processed successfully: Notification pushed to online user`);
    } else {
      console.log(`Job ${job.id} processed successfully: User offline`);
    }
  },
  {
    connection
  }
);
