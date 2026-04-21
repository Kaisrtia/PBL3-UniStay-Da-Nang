import { Worker, Job } from 'bullmq';
import { connection } from '../core/config/redis.connection';
import prismaClient from '../core/config/prisma';
import { notification_type } from '@prisma/client';
import { addCensorPostNotificationJob } from '../queues/notification.queue';
import { createPostCensorNotification } from '../modules/notification/services/notification.service';

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
    const post = await prismaClient.post.findUnique({
      where: {
        id: job.data.postId
      }
    });

    if (!post) {
      return;
    }
    if (!imageModerationResult.isApproved) {
      await prismaClient.post.update({
        where: {
          id: job.data.postId
        },
        data: {
          status: 'REJECTED',
          rejectionReason: imageModerationResult.reason
        }
      });
      const notification = await createPostCensorNotification(
        post.userId,
        job.data.postId,
        'REJECTED',
        imageModerationResult.reason
      );
      addCensorPostNotificationJob('automated_censoring', {
        notificationId: notification.id
      });
    } else if (!textModerationResult.isApproved) {
      await prismaClient.post.update({
        where: {
          id: job.data.postId
        },
        data: {
          status: 'REJECTED',
          rejectionReason: textModerationResult.reason
        }
      });
      const notification = await createPostCensorNotification(
        post.userId,
        job.data.postId,
        'REJECTED',
        textModerationResult.reason
      );
      addCensorPostNotificationJob('automated_censoring', {
        notificationId: notification.id
      });
    } else {
      await prismaClient.post.update({
        where: {
          id: job.data.postId
        },
        data: {
          status: 'APPROVED'
        }
      });
      const notification = await createPostCensorNotification(
        post.userId,
        job.data.postId,
        'APPROVED'
      );
      await addCensorPostNotificationJob('automated_censoring', {
        notificationId: notification.id
      });
    }
  },
  { connection }
);
