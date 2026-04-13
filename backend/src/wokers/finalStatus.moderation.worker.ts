import { Worker, Job } from 'bullmq';
import { connection } from '../queues/redis.connection';

export const finalModerationWorker = new Worker('final-status-queue', async(job: Job) => {
  console.log("Reached parent job!");
}, { connection });
