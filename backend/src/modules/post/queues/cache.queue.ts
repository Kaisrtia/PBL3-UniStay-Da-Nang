import { Queue } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';

export const postCacheQueue = new Queue('postCacheQueue', {
  connection
});

// Initialize the repeatable job to trace and cache approved posts
export const initCacheJob = async () => {
  await postCacheQueue.add(
    'cacheApprovedPosts',
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
