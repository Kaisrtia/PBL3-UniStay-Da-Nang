import { Worker, Job } from 'bullmq';
import { connection } from '../queues/redis.connection';
import { prisma } from '../core/config/database';

export const moderationWorker = new Worker('ai-moderation', async (job: Job) => {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  console.log('Job data:', job.data);
  
  // Generic scaffold processing 
  // TODO: Add detailed process logic here later
  const { postId } = job.data;
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      postImages: true,
      postAmenities: true
    }
  });
  console.log(post);
  
  return { success: true };
}, { 
  connection,
  // --- WORKER POLICIES ---
  concurrency: 5, // Process up to 5 jobs simultaneously
  limiter: {
    max: 10,      // Maximum number of jobs processed
    duration: 1000 // ...per duration in milliseconds (10 jobs per second)
  },
  lockDuration: 30000 // How long the worker locks a job for processing before another worker tries (30s)
});

moderationWorker.on('completed', (job: Job) => {
  console.log(`Job ${job.id} has completed successfully!`);
});

moderationWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
