import { FlowProducer, Queue } from 'bullmq';
import { connection } from './redis.connection';

const flowProducer = new FlowProducer({connection});
export const finalStatusQueue = new Queue('final-status-queue', { connection });
export const imageModerationQueue = new Queue('image-moderation-queue', { connection });
export const textModerationQueue = new Queue('text-moderation-queue', { connection });

export const addModerationFlow = async (postId: any) => {
  return flowProducer.add({
    name: 'final-moderation-status',
    queueName: 'final-status-queue',
    data: { postId },
    children: [
      {
        name: 'image-moderation',
        queueName: 'image-moderation-queue',
        data: { postId },
        opts: {
          attempts: 3, 
          backoff: {
            type: 'exponential', 
            delay: 3000, 
          },
        }
      },
      {
        name: 'text-moderation',
        queueName: 'text-moderation-queue',
        data: { postId },
        opts: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 3000
          },
        }
      },
    ],
  });
};