import { Queue } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';

export const postCacheQueue = new Queue('postCacheQueue', {
  connection
});

export const addPostCacheRefreshJob = async () => {
  await postCacheQueue.add(
    'cacheApprovedPosts:changed',
    {},
    {
      removeOnComplete: true,
      removeOnFail: false
    }
  );
};

// Initialize the repeatable job to trace and cache approved posts
export const initCacheJob = async () => {
  const repeatableJobs = await postCacheQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === 'cacheApprovedPosts') {
      await postCacheQueue.removeRepeatableByKey(job.key);
    }
  }

  await postCacheQueue.add(
    'cacheApprovedPosts',
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
