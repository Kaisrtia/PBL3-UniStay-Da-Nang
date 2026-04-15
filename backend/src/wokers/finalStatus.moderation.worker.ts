import { Worker, Job } from 'bullmq';
import { connection } from '../core/config/redis.connection';

export const finalModerationWorker = new Worker('final-status-queue', async(job: Job) => {
  console.log("Reached parent job!");
}, { connection });
