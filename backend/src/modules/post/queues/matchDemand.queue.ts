import { Queue } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';

export const matchDemandQueue = new Queue('matchDemandQueue', {
  connection
});

export const addMatchDemandJob = async (
  jobName: string,
  data: { postId: string }
) => {
  await matchDemandQueue.add(jobName, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000
    },
    removeOnComplete: true,
    removeOnFail: 100
  });
};
