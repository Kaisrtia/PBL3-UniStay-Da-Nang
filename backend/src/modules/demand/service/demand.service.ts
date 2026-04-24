import prismaClient from '../../../core/config/prisma';
import HttpStatus from 'http-status';
import { AppError } from '../../../core/exceptions/AppError';
import { room_type } from '@prisma/client';

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
  }
) => {
  // Validate the ward
  const ward = await prismaClient.ward.findUnique({
    where: { id: data.wardId }
  });

  if (!ward) {
    throw new AppError(HttpStatus.NOT_FOUND, 'Ward not found');
  }

  // Validate the university only if provided
  if (data.universityId) {
    const university = await prismaClient.university.findUnique({
      where: { id: data.universityId }
    });

    if (!university) {
      throw new AppError(HttpStatus.NOT_FOUND, 'University not found');
    }
  }

  if (data.minPrice < 0 || data.maxPrice < 0 || data.minPrice > data.maxPrice) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid price range');
  }

  if (!Object.values(room_type).includes(data.roomType)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid room type');
  }

  // Upsert the demand limit to 1 per student (since studentId is @id in student_demand)
  const demand = await prismaClient.student_demand.upsert({
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

  return demand;
};
