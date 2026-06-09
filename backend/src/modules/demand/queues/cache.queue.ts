import { Queue } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';

export const demandCacheQueue = new Queue('demandCacheQueue', {
  connection
});

export const addDemandCacheRefreshJob = async () => {
  return demandCacheQueue.add('cacheStudentDemands:on-demand', {}, {
    jobId: 'cacheStudentDemands:on-demand',
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: true
  });
};

// Initialize the repeatable job to trace and cache student demands
export const initDemandCacheJob = async () => {
  await demandCacheQueue.add('cacheStudentDemands:startup', {}, {
    removeOnComplete: true,
    removeOnFail: false
  });

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
