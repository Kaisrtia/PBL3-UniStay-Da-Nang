import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { demand_criterion_priority, room_type } from '@prisma/client';
import { addDemandCacheRefreshJob } from '../queues/cache.queue';

export const createStudentDemand = async (
  studentId: string,
  data: {
    wardId?: number;
    universityId: string;
    locationRadiusMeters: number;
    minPrice: number;
    maxPrice: number;
    minArea?: number;
    maxArea?: number;
    roomType: room_type;
    isLookingForRoommate?: boolean;
    roommateGender?: string;
    rommateCriteria?: string;
    pricePriority?: demand_criterion_priority;
    locationPriority?: demand_criterion_priority;
    areaPriority?: demand_criterion_priority;
    roommatePriority?: demand_criterion_priority;
    roomTypePriority?: demand_criterion_priority;
    amenityPriority?: demand_criterion_priority;
    amenityIds?: number[];
  }
) => {
  if (data.minPrice < 0 || data.maxPrice < 0 || data.minPrice > data.maxPrice) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid price range');
  }

  if (!Number.isInteger(data.locationRadiusMeters) || data.locationRadiusMeters <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid location radius');
  }

  if (
    data.minArea !== undefined &&
    (data.minArea <= 0 || (data.maxArea !== undefined && data.minArea > data.maxArea))
  ) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid area range');
  }

  if (data.maxArea !== undefined && data.maxArea <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid area range');
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

    if (data.wardId !== undefined) {
      const ward = await tx.ward.findUnique({
        where: { id: data.wardId }
      });

      if (!ward) {
        throw new AppError(HttpStatus.NOT_FOUND, 'Ward not found');
      }
    }

    const university = await tx.university.findUnique({
      where: { id: data.universityId }
    });

    if (!university) {
      throw new AppError(HttpStatus.NOT_FOUND, 'University not found');
    }

    if (university.latitude === null || university.longitude === null) {
      throw new AppError(HttpStatus.BAD_REQUEST, 'University location is missing');
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
        wardId: data.wardId ?? null,
        universityId: data.universityId,
        locationRadiusMeters: data.locationRadiusMeters,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        minArea: data.minArea ?? null,
        maxArea: data.maxArea ?? null,
        roomType: data.roomType,
        isLookingForRoommate: data.isLookingForRoommate ?? false,
        roommateGender: data.roommateGender ?? '',
        rommateCriteria: data.rommateCriteria ?? '',
        pricePriority: data.pricePriority ?? demand_criterion_priority.MEDIUM,
        locationPriority: data.locationPriority ?? demand_criterion_priority.MEDIUM,
        areaPriority: data.areaPriority ?? demand_criterion_priority.MEDIUM,
        roommatePriority: data.roommatePriority ?? demand_criterion_priority.MEDIUM,
        roomTypePriority: data.roomTypePriority ?? demand_criterion_priority.MEDIUM,
        amenityPriority: data.amenityPriority ?? demand_criterion_priority.MEDIUM
      },
      create: {
        studentId,
        wardId: data.wardId,
        universityId: data.universityId,
        locationRadiusMeters: data.locationRadiusMeters,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        minArea: data.minArea,
        maxArea: data.maxArea,
        roomType: data.roomType,
        isLookingForRoommate: data.isLookingForRoommate ?? false,
        roommateGender: data.roommateGender ?? '',
        rommateCriteria: data.rommateCriteria ?? '',
        pricePriority: data.pricePriority ?? demand_criterion_priority.MEDIUM,
        locationPriority: data.locationPriority ?? demand_criterion_priority.MEDIUM,
        areaPriority: data.areaPriority ?? demand_criterion_priority.MEDIUM,
        roommatePriority: data.roommatePriority ?? demand_criterion_priority.MEDIUM,
        roomTypePriority: data.roomTypePriority ?? demand_criterion_priority.MEDIUM,
        amenityPriority: data.amenityPriority ?? demand_criterion_priority.MEDIUM
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
