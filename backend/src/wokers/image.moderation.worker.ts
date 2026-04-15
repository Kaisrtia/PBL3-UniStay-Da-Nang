import { Worker, Job } from 'bullmq';
import { connection } from '../core/config/redis.connection';
import { prisma } from '../core/config/database';
import { vl } from 'moondream';
import config from '../core/config/config';
import { finalStatusQueue } from '../queues/moderation.queue'


const moondreamClient = new vl({ apiKey: config.ai_key.moondream });

export const imageModerationWorker = new Worker('image-moderation-queue', async (job: Job) => {
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
  
  try {
    let imageModerationResult = null;

    if (post.postImages && post.postImages.length > 0) {
      console.log(`Analyzing first image for Post ${postId} using Moondream...`);
      const imageUrl = post.postImages[0].imageUrl;
      
      try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        const mdResponse = await moondreamClient.query({
          image: imageBuffer,
          question: `
            You are an AI moderator for a housing rental platform. 
            Analyze this image.
            Are there any inappropriate contents, violent signs, or fake watermarks ?
            Or is it really a photograph depicting any space within a property ?
            Please follow this sample of respone format: "{"isApproved":false,"reason":"your reason"}": 
            "isApproved" (boolean) and "reason" (string explaining why).
          `
        });
        
        imageModerationResult = mdResponse.answer;
        console.log(`Moondream result for Post ${postId}:`, imageModerationResult, typeof(imageModerationResult));
        return imageModerationResult;
      } catch (mdError) {
        console.warn(`Moondream failed for image ${imageUrl}: `, mdError);
      }
    }
  } catch(error) {
    console.error(`AI Image Moderation Error for Post ${postId}:`, error);
    throw error; // Let BullMQ handle the failure & retry policies
  }
}, { connection });

imageModerationWorker.on('failed', async (job: Job | undefined, err: Error) => {
  if (job!.attemptsMade >= job!.opts.attempts!) {
    console.log("Error for moderating post's images!");
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