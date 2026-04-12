import { Queue } from 'bullmq';
import { connection } from './redis.connection';

export const moderationAssistQueue = new Queue('ai-moderation', {
  connection,
});

export const addModerationJob = async (name: string, data: any) => {
  return moderationAssistQueue.add(name, data, {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: 'exponential', // Wait 1s, 2s, 4s between retries
      delay: 1000,
    },
    removeOnComplete: true, // Remove job from queue once finished
    removeOnFail: true, // Keep failed jobs for inspection
  });
};