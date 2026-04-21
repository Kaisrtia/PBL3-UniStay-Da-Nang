import { create } from 'domain';
import prisma from '../../../core/config/prisma';
import { connection } from '../../../core/config/redis.connection';
import { Worker, Job } from 'bullmq';
import { createPostCensorNotification } from '../services/notification.service';

new Worker(
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
    const isOnline = await connection.sismember(
      'online_users',
      notification.userId
    );
    if (isOnline) {
      await connection.publish(
        `user_notif:${notification.userId}`,
        JSON.stringify(notification)
      );
      console.log(`Job ${job.id} processed successfully`);
    }
  },
  { connection }
);

new Worker(
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
    const isOnline = await connection.sismember('online_users', userId);
    console.log(`User ${userId} is ${isOnline ? 'online' : 'offline'}`);
    if (isOnline) {
      await connection.publish(
        `user_notif:${userId}`,
        JSON.stringify(notification)
      );
      console.log(`Job ${job.id} processed successfully`);
    }
  },
  { connection }
);
