import { Worker } from 'bullmq';
import { connection } from '../../../core/config/redis.connection';
import prismaClient from '../../../core/config/prisma';

export const demandCacheWorker = new Worker(
  'demandCacheQueue',
  async () => {
    try {
      console.log(
        'Running demandCacheWorker: caching student demands to Redis'
      );

      const studentDemands = await prismaClient.student_demand.findMany({
        include: {
          ward: true,
          university: true,
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true
                }
              },
              demandAmenities: {
                include: {
                  amenity: true
                }
              }
            }
          }
        }
      });

      const CACHE_KEY = 'cache:demands:student';
      await connection.set(CACHE_KEY, JSON.stringify(studentDemands));

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
