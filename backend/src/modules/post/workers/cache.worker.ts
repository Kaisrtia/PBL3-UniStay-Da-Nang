import { Worker } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import prismaClient from '../../../core/config/prisma';

export const postCacheWorker = new Worker(
  'postCacheQueue',
  async (job) => {
    try {
      console.log('Running postCacheWorker: caching APPROVED posts to Redis');

      const approvedPosts = await prismaClient.post.findMany({
        where: {
          status: 'APPROVED'
        },
        include: {
          postImages: true,
          postAmenities: {
            include: { amenity: true }
          },
          ward: true,
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              hosts: {
                select: { isVerified: true }
              }
            }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const CACHE_KEY = 'cache:posts:approved';
      await connection.set(CACHE_KEY, JSON.stringify(approvedPosts));

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
