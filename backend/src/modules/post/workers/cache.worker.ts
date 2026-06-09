import { Worker } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import { refreshApprovedPostCache } from '../utils/approvedPostCache';

export const postCacheWorker = new Worker(
  'postCacheQueue',
  async () => {
    try {
      console.log('Running postCacheWorker: caching APPROVED posts to Redis');

      const approvedPosts = await refreshApprovedPostCache();

      console.log(
        `Cached ${approvedPosts.length} APPROVED posts successfully.`
      );
    } catch (error) {
      console.error('Error in postCacheWorker:', error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 1
  }
);

postCacheWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`);
});
