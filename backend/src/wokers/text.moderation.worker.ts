import { Worker, Job } from 'bullmq';
import { connection } from '../core/config/redis.connection';
import { prisma } from '../core/config/database';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../core/config/config';
import { finalStatusQueue } from '../queues/moderation.queue';

const genAI = new GoogleGenerativeAI(config.ai_key.gemini);

export const textModerationWorker = new Worker(
  'text-moderation-queue',
  async (job: Job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);

    const { postId } = job.data.postId;
    let post;
    try {
      post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          postImages: true,
          postAmenities: true
        }
      });

      if (!post) {
        console.log(`Post ${postId} not found. Skipping...`);
        return { success: false, reason: 'Post not found' };
      }
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      throw error;
    }

    // term test
    // return JSON.stringify({
    //   isApproved: true,
    //   reason: 'everything will be okay'
    // });

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
      You are an AI moderator for a housing rental platform. 
      Analyze the following housing description. 
      
      Determine if this post is valid. Look out for profanity, offensive language, scams, or invalid image contents.
      Please follow this sample of respone format: "{"isApproved":false,"reason":"your reason"}": 
      "isApproved" (boolean) and "reason" (string explaining why).

      Description to analyze:
      """
      ${post.description}
      """
    `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log(`Gemini moderation result for Post ${postId}:`, responseText);
      return responseText;
    } catch (error) {
      console.error(`AI Image Moderation Error for Post ${postId}:`, error);
      throw error; // Let BullMQ handle the failure & retry policies
    }
  },
  { connection }
);

textModerationWorker.on('failed', async (job: Job | undefined, err: Error) => {
  if (job!.attemptsMade >= job!.opts.attempts!) {
    console.log("Error for moderating post's description!");
    // Send report for admin to handle manually
    // ...
    const parentKey = job!.parentKey;
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
