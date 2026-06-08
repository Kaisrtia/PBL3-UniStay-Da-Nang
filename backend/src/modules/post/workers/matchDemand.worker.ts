import { Worker } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import prismaClient from '../../../core/config/prisma';
import { calculateScore } from '../../demand/utils/matching.handler';
import { notification_type } from '@prisma/client';
import { pushNotificationIfOnline } from '../../notification/utils/pushNotification';

const MIN_SCORE_THRESHOLD = 0.6;

export const matchDemandWorker = new Worker(
  'matchDemandQueue',
  async (job) => {
    try {
      const { postId } = job.data;
      console.log(`Running matchDemandWorker for post: ${postId}`);

      // 1. Get post data
      const post = await prismaClient.post.findFirst({
        where: {
          id: postId,
          status: 'APPROVED'
        },
        include: {
          ward: true,
          postAmenities: true
        }
      });

      if (!post) {
        console.log(`Approved post ${postId} not found.`);
        return;
      }

      // 2. Access student demands from Cache
      const CACHE_KEY = 'cache:demands:student';
      const cachedDemandsJson = await connection.get(CACHE_KEY);

      if (!cachedDemandsJson) {
        console.log('No student demands cached.');
        return;
      }

      const demands = JSON.parse(cachedDemandsJson);

      // 3. Match score for each demand. Recommended posts must reach 60%.
      for (const demand of demands) {
        const score = calculateScore(post, demand);

        if (score >= MIN_SCORE_THRESHOLD) {
          console.log(
            `Matched student ${demand.studentId} for post ${post.id} with score: ${score}`
          );

          const notificationTitle = 'Có phòng mới phù hợp với nhu cầu của bạn!';
          const notificationContent = `Gợi ý: ${post.title} (Độ phù hợp: ${(score * 100).toFixed(0)}%)`;

          // 4. Save notification to DB
          const dedupeKey = `match-demand:${demand.studentId}:${post.id}`;
          const newNotif = await prismaClient.notification.upsert({
            where: { dedupeKey },
            update: {
              title: notificationTitle,
              content: notificationContent,
              isRead: false,
              updatedAt: new Date(),
              metaData: { postId: post.id, score }
            },
            create: {
              userId: demand.studentId, // Ensure it points to the user.id representing the student
              dedupeKey,
              title: notificationTitle,
              content: notificationContent,
              type: notification_type.SYSTEM,
              metaData: { postId: post.id, score }
            }
          });

          // 5. Send SSE message if the user has an active subscriber
          await pushNotificationIfOnline(demand.studentId, newNotif);
        }
      }
    } catch (error) {
      console.error('Error in matchDemandWorker:', error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5
  }
);

matchDemandWorker.on('failed', (job, err) => {
  console.error(
    `matchDemandWorker: Job ${job?.id} failed with error ${err.message}`
  );
});
