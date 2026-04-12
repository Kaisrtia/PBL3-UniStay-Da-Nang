import { Worker, Job } from 'bullmq';
import { connection } from '../queues/connection';

export const moderationWorker = new Worker('moderation-assist', async (job: Job) => {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  console.log('Job data:', job.data);
  
  // Generic scaffold processing 
  // TODO: Add detailed process logic here later
  
  return { success: true };
}, { connection });

moderationWorker.on('completed', (job: Job) => {
  console.log(`Job ${job.id} has completed successfully!`);
});

moderationWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
