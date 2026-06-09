import { Worker } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import { refreshStudentDemandCache } from '../utils/studentDemandCache';

export const demandCacheWorker = new Worker(
  'demandCacheQueue',
  async () => {
    try {
      console.log(
        'Running demandCacheWorker: caching student demands to Redis'
      );

      const studentDemands = await refreshStudentDemandCache();

      console.log(
        `Cached ${studentDemands.length} student demands successfully.`
      );
    } catch (error) {
      console.error('Error in demandCacheWorker:', error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 1
  }
);

demandCacheWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`);
});
