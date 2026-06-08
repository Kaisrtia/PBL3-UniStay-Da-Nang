import { Worker, Job } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import prismaClient from '../../../core/config/prisma';
import { addCensorPostNotificationJob } from '../../notification/queues/notification.queue';
import { createPostCensorNotification } from '../../notification/services/notification.service';
import { addMatchDemandJob } from '../queues/matchDemand.queue';
import {
  ModerationResult,
  ModerationStep,
  normalizeModerationResult
} from '../utils/moderation.helper';

const getFallbackStep = (childKey: string): ModerationStep => {
  if (childKey.includes('image-moderation-queue')) return 'image';
  return 'text';
};

const createCensorNotificationJob = async (
  userId: string,
  postId: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
) => {
  const notification = await createPostCensorNotification(
    userId,
    postId,
    status,
    reason
  );
  addCensorPostNotificationJob('automated_censoring', {
    notificationId: notification.id
  }).catch(err => {
    console.error('Error enqueueing post censor notification job:', err);
  });
};

const markPostPendingManualReview = async (postId: string, reason: string) => {
  await prismaClient.post.update({
    where: { id: postId },
    data: {
      status: 'PENDING',
      rejectionReason: reason
    }
  });
};

export const finalModerationWorker = new Worker(
  'final-status-queue',
  async (job: Job) => {
    console.log(`Processing ${job.name}`);
    const childrenData = await job.getChildrenValues();
    const moderationResults = Object.entries(childrenData).map(
      ([childKey, childResult]) =>
        normalizeModerationResult(childResult, getFallbackStep(childKey))
    );
    const imageModerationResult = moderationResults.find(
      (result): result is ModerationResult => result.step === 'image'
    );
    const textModerationResult = moderationResults.find(
      (result): result is ModerationResult => result.step === 'text'
    );
    const post = await prismaClient.post.findUnique({
      where: {
        id: job.data.postId
      }
    });

    if (!post) {
      return;
    }

    if (!imageModerationResult || !textModerationResult) {
      await markPostPendingManualReview(
        post.id,
        'Automatic moderation requires manual review. Moderation result is missing'
      );
      return;
    }

    const manualReviewReasons = [
      imageModerationResult.requiresManualReview &&
        `Image moderation: ${imageModerationResult.reason}`,
      textModerationResult.requiresManualReview &&
        `Text moderation: ${textModerationResult.reason}`
    ].filter(Boolean) as string[];

    if (manualReviewReasons.length > 0) {
      await markPostPendingManualReview(
        post.id,
        `Automatic moderation requires manual review. ${manualReviewReasons.join('; ')}`
      );
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
      await createCensorNotificationJob(
        post.userId,
        job.data.postId,
        'REJECTED',
        imageModerationResult.reason
      );
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
      await createCensorNotificationJob(
        post.userId,
        job.data.postId,
        'REJECTED',
        textModerationResult.reason
      );
    } else {
      await prismaClient.post.update({
        where: {
          id: job.data.postId
        },
        data: {
          status: 'APPROVED'
        }
      });
      await createCensorNotificationJob(
        post.userId,
        job.data.postId,
        'APPROVED'
      );
      await addMatchDemandJob('match_approved_post_ai', {
        postId: job.data.postId
      });
    }
  },
  { connection }
);
