import { Worker, Job } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import prismaClient from '../../../core/config/prisma';
import { vl } from 'moondream';
import config from '../../../core/config/config';
import { finalStatusQueue } from '../queues/moderation.queue';
import {
  createManualReviewResult,
  createModerationResult,
  parseAiModerationAnswer,
  stringifyModerationResult
} from '../utils/moderation.helper';
import { fetchSafeRemoteImage } from '../../../core/utils/safeRemoteImage';

const moondreamClient = new vl({ apiKey: config.ai_key.moondream });
const IMAGE_MODERATION_PROMPT = `
  You are an AI moderator for a housing rental platform.
  Analyze this image.
  Are there any inappropriate contents, violent signs, or fake watermarks?
  Or is it really a photograph depicting any space within a property?
  Respond with JSON format:
  "isApproved" (true if both conditions are met) and "reason" (short string explaining why).
`;

const buildImageReason = (imageIndex: number, reason: string) =>
  `Image ${imageIndex + 1}: ${reason}`;

const markPostPendingManualReview = async (postId: string, reason: string) => {
  await prismaClient.post.update({
    where: { id: postId },
    data: {
      status: 'PENDING',
      rejectionReason: reason
    }
  });
};

export const imageModerationWorker = new Worker(
  'image-moderation-queue',
  async (job: Job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);

    const { postId } = job.data;
    let post;
    try {
      post = await prismaClient.post.findUnique({
        where: { id: postId },
        include: {
          postImages: true,
          postAmenities: true
        }
      });

      if (!post) {
        console.log(`Post ${postId} not found. Skipping...`);
        return stringifyModerationResult(
          createManualReviewResult('image', 'Post not found')
        );
      }
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      return stringifyModerationResult(
        createManualReviewResult('image', 'Unable to fetch post for moderation')
      );
    }

    // term test
    // return JSON.stringify({"isApproved":true, "reason":"everything will be okay"});

    if (!post.postImages || post.postImages.length === 0) {
      return stringifyModerationResult(
        createModerationResult('image', true, 'No images to moderate')
      );
    }

    const manualReviewReasons: string[] = [];
    const rejectionReasons: string[] = [];

    for (const [imageIndex, postImage] of post.postImages.entries()) {
      const imageUrl = postImage.imageUrl;
      console.log(
        `Analyzing image ${imageIndex + 1}/${post.postImages.length} for Post ${postId} using Moondream...`
      );

      try {
        const imageBuffer = await fetchSafeRemoteImage(imageUrl);

        const mdResponse = await moondreamClient.query({
          image: imageBuffer,
          question: IMAGE_MODERATION_PROMPT
        });

        const moderationResult = parseAiModerationAnswer(
          mdResponse.answer,
          'image'
        );
        console.log(
          `Moondream result for Post ${postId}, image ${imageIndex + 1}:`,
          mdResponse.answer
        );

        if (moderationResult.requiresManualReview) {
          manualReviewReasons.push(
            buildImageReason(imageIndex, moderationResult.reason)
          );
        } else if (!moderationResult.isApproved) {
          rejectionReasons.push(
            buildImageReason(imageIndex, moderationResult.reason)
          );
        }
      } catch (error) {
        console.error(`AI Image Moderation Error for ${imageUrl}:`, error);
        manualReviewReasons.push(
          buildImageReason(imageIndex, 'Image moderation failed')
        );
      }
    }

    if (manualReviewReasons.length > 0) {
      return stringifyModerationResult(
        createManualReviewResult('image', manualReviewReasons.join('; '))
      );
    }

    if (rejectionReasons.length > 0) {
      return stringifyModerationResult(
        createModerationResult('image', false, rejectionReasons.join('; '))
      );
    }

    return stringifyModerationResult(
      createModerationResult('image', true, 'All images approved')
    );
  },
  { connection }
);

imageModerationWorker.on('failed', async (job: Job | undefined, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    console.log("Error for moderating post's images!");
    try {
      await markPostPendingManualReview(
        job.data.postId,
        `Automatic image moderation failed. Please review manually. ${err.message}`
      );
    } catch (updateErr) {
      console.error('Error marking post for manual image review:', updateErr);
    }

    const parentKey = job.parentKey;
    if (parentKey) {
      try {
        // parentKey: "bull:queueName:jobId"
        const parentJobId = parentKey.split(':').pop();

        if (parentJobId) {
          const parentJob = await finalStatusQueue.getJob(parentJobId);
          if (parentJob) {
            await parentJob.remove();
            console.log(`Removed parent job: ${parentJobId}`);
          }
        }
      } catch (removeErr) {
        console.error('Error when remove parent job:', removeErr);
      }
    }
  }
});
