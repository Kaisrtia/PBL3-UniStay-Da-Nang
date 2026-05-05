import { Queue } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';

export const demandCacheQueue = new Queue('demandCacheQueue', {
  connection
});

// Initialize the repeatable job to trace and cache student demands
export const initDemandCacheJob = async () => {
  await demandCacheQueue.add(
    'cacheStudentDemands',
    {},
    {
      repeat: {
        every: 5 * 60 * 1000 // 5 minutes in milliseconds
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  );
};
