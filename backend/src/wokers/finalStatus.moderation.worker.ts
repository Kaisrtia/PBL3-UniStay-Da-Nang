import { Worker, Job } from 'bullmq';
import { connection } from '../core/config/redis.connection';
import { prisma } from '../core/config/database';
import { notification_type } from '@prisma/client';
import { addCensorPostNotificationJob } from '../queues/notification.queue';

export const finalModerationWorker = new Worker(
  'final-status-queue',
  async (job: Job) => {
    console.log(`Processing ${job.name}`);
    const childrenData = await job.getChildrenValues();
    const imageModerationResult = JSON.parse(
      Object.entries(childrenData).at(0)?.[1]
    );
    const textModerationResult = JSON.parse(
      Object.entries(childrenData).at(1)?.[1]
    );
    const post = await prisma.post.findUnique({
      where: {
        id: job.data.postId
      }
    });

    if (!post) {
      return;
    }
    if (!imageModerationResult.isApproved) {
      await prisma.post.update({
        where: {
          id: job.data.postId
        },
        data: {
          status: 'REJECTED',
          rejectionReason: imageModerationResult.reason
        }
      });
      const notification = await prisma.notification.create({
        data: {
          title: `Your post with id ${job.data.postId} was rejected by system`,
          content: `Your post: ${post.title} was rejected. The reason is ${imageModerationResult.reason}`,
          type: notification_type.POST,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            connect: { id: post.userId }
          }
        }
      });
      addCensorPostNotificationJob('notify-censor-status-of-post', {
        notificationId: notification.id
      });
    } else if (!textModerationResult.isApproved) {
      await prisma.post.update({
        where: {
          id: job.data.postId
        },
        data: {
          status: 'REJECTED',
          rejectionReason: textModerationResult.reason
        }
      });
      const notification = await prisma.notification.create({
        data: {
          title: `Your post with id ${job.data.postId} was rejected by system`,
          content: `Your post: ${post.title} was rejected. The reason is ${textModerationResult.reason}`,
          type: notification_type.POST,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            connect: { id: post.userId }
          }
        }
      });
      addCensorPostNotificationJob('notify-censor-status-of-post', {
        notificationId: notification.id
      });
    } else {
      await prisma.post.update({
        where: {
          id: job.data.postId
        },
        data: {
          status: 'APPROVED'
        }
      });
      const notification = await prisma.notification.create({
        data: {
          title: `Your post with id ${job.data.postId} was approved by system`,
          content: `Your post: ${post.title} was approved`,
          type: notification_type.POST,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            connect: { id: post.userId }
          }
        }
      });
      await addCensorPostNotificationJob('notify-censor-status-of-post', {
        notificationId: notification.id
      });
    }
  },
  { connection }
);
