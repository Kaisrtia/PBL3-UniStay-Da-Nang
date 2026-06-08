import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { room_type } from '@prisma/client';
import { addDemandCacheRefreshJob } from '../queues/cache.queue';

export const createStudentDemand = async (
  studentId: string,
  data: {
    wardId: number;
    universityId?: string;
    minPrice: number;
    maxPrice: number;
    roomType: room_type;
    isLookingForRoommate?: boolean;
    roommateGender?: string;
    rommateCriteria?: string;
    amenityIds?: number[];
  }
) => {
  if (data.minPrice < 0 || data.maxPrice < 0 || data.minPrice > data.maxPrice) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid price range');
  }

  if (!Object.values(room_type).includes(data.roomType)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid room type');
  }

  const amenityIds = Array.from(new Set(data.amenityIds ?? []));

  // Upsert the demand limit to 1 per student (since studentId is @id in student_demand)
  const demand = await prismaClient.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { studentId }
    });

    if (!student) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Student profile not found');
    }

    const ward = await tx.ward.findUnique({
      where: { id: data.wardId }
    });

    if (!ward) {
      throw new AppError(HttpStatus.NOT_FOUND, 'Ward not found');
    }

    if (data.universityId) {
      const university = await tx.university.findUnique({
        where: { id: data.universityId }
      });

      if (!university) {
        throw new AppError(HttpStatus.NOT_FOUND, 'University not found');
      }
    }

    if (amenityIds.length > 0) {
      const existingAmenities = await tx.amenity.findMany({
        where: {
          id: {
            in: amenityIds
          }
        },
        select: {
          id: true
        }
      });

      if (existingAmenities.length !== amenityIds.length) {
        throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid amenity IDs');
      }
    }

    await tx.student_demand.upsert({
      where: { studentId },
      update: {
        wardId: data.wardId,
        ...(data.universityId ? { universityId: data.universityId } : { universityId: null }),
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        roomType: data.roomType,
        isLookingForRoommate: data.isLookingForRoommate ?? false,
        roommateGender: data.roommateGender ?? '',
        rommateCriteria: data.rommateCriteria ?? ''
      },
      create: {
        studentId,
        wardId: data.wardId,
        ...(data.universityId && { universityId: data.universityId }),
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        roomType: data.roomType,
        isLookingForRoommate: data.isLookingForRoommate ?? false,
        roommateGender: data.roommateGender ?? '',
        rommateCriteria: data.rommateCriteria ?? ''
      }
    });

    await tx.demand_amenity.deleteMany({
      where: { studentId }
    });

    if (amenityIds.length > 0) {
      await tx.demand_amenity.createMany({
        data: amenityIds.map((amenityId) => ({
          studentId,
          amenityId
        }))
      });
    }

    return tx.student_demand.findUnique({
      where: { studentId },
      include: {
        student: {
          include: {
            demandAmenities: {
              include: {
                amenity: true
              }
            }
          }
        },
        ward: true,
        university: true
      }
    });
  });

  addDemandCacheRefreshJob().catch(err => {
    console.error('Error enqueueing demand cache refresh job:', err);
  });

  return demand;
};
