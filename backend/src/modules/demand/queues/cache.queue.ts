import { Queue } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';

export const demandCacheQueue = new Queue('demandCacheQueue', {
  connection
});

export const addDemandCacheRefreshJob = async () => {
  return demandCacheQueue.add(
    'cacheStudentDemands:on-demand',
    {},
    {
      jobId: 'cacheStudentDemands:on-demand',
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true,
      removeOnFail: true
    }
  );
};

// Initialize the repeatable job to trace and cache student demands
export const initDemandCacheJob = async () => {
  const repeatableJobs = await demandCacheQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === 'cacheStudentDemands') {
      await demandCacheQueue.removeRepeatableByKey(job.key);
    }
  }

  await demandCacheQueue.add(
    'cacheStudentDemands',
    {},
    {
      repeat: {
        every: 5 * 60 * 1000, // 5 minutes in milliseconds
        immediately: true
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  );
};
