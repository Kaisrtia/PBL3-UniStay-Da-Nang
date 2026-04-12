import { Queue } from 'bullmq';
import { connection } from './connection';

export const moderationAssistQueue = new Queue('moderation-assist', {
  connection,
});

export const addModerationJob = async (name: string, data: any) => {
  return moderationAssistQueue.add(name, data);
};