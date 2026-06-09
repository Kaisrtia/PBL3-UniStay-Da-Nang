import prismaClient from '../../../core/config/prisma';
import { cacheConnection } from '../../../core/config/redis.connection';

export const STUDENT_DEMAND_CACHE_KEY = 'cache:demands:student';

const studentDemandInclude = {
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
} as const;

export const fetchStudentDemandsFromDatabase = () =>
  prismaClient.student_demand.findMany({
    include: studentDemandInclude
  });

type CachedStudentDemand = Awaited<
  ReturnType<typeof fetchStudentDemandsFromDatabase>
>[number];

const isCachedStudentDemandArray = (
  value: unknown
): value is CachedStudentDemand[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { studentId?: unknown }).studentId === 'string'
  );

export const refreshStudentDemandCache = async () => {
  const demands = await fetchStudentDemandsFromDatabase();
  await cacheConnection.set(STUDENT_DEMAND_CACHE_KEY, JSON.stringify(demands));
  return demands;
};

export const getStudentDemandsWithFallback = async () => {
  try {
    const cachedDemandsJson = await cacheConnection.get(
      STUDENT_DEMAND_CACHE_KEY
    );

    if (cachedDemandsJson) {
      const cachedDemands: unknown = JSON.parse(cachedDemandsJson);
      if (isCachedStudentDemandArray(cachedDemands)) {
        return cachedDemands;
      }
    }
  } catch (error) {
    console.error('Unable to read student demand cache, using database:', error);
  }

  const demands = await fetchStudentDemandsFromDatabase();
  cacheConnection
    .set(STUDENT_DEMAND_CACHE_KEY, JSON.stringify(demands))
    .catch((error) => {
      console.error('Unable to warm student demand cache:', error);
    });
  return demands;
};
