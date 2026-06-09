import prisma from '../../../core/config/prisma';
import { connection } from '../../../core/config/redis.connection';
import { Worker, Job } from 'bullmq';
import { createPostCensorNotification } from '../services/notification.service';
import { pushNotificationIfOnline } from '../utils/pushNotification';

export const automatedCensorNotificationWorker = new Worker(
  'censor-post-notification-queue',
  async (job: Job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const { notificationId } = job.data;
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId
      }
    });
    if (!notification) {
      return;
    }
    const sent = await pushNotificationIfOnline(notification.userId, notification);
    if (sent) {
      console.log(`Job ${job.id} processed successfully`);
    }
  },
  { connection }
);

export const manualCensorNotificationWorker = new Worker(
  'censor-manual-notification-queue',
  async (job: Job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    const { postId, userId, status, rejectionReason } = job.data;
    const notification = await createPostCensorNotification(
      userId,
      postId,
      status,
      rejectionReason
    );
    const sent = await pushNotificationIfOnline(userId, notification);
    console.log(`User ${userId} is ${sent ? 'online' : 'offline'}`);
    if (sent) {
      console.log(`Job ${job.id} processed successfully`);
    }
  },
  { connection }
);
