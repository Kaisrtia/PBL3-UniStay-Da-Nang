import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as demandService from '../service/demand.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

// -- Student Actions --

export const handleCreateStudentDemand = async (req: Request, res: Response) => {
  const {
    wardId,
    universityId,
    minPrice,
    maxPrice,
    roomType,
    isLookingForRoommate,
    roommateGender,
    rommateCriteria,
    amenityIds,
    demandAmenities
  } = req.body;

  if (wardId === undefined || minPrice === undefined || maxPrice === undefined || !roomType) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'wardId, minPrice, maxPrice, and roomType are required'
    );
  }

  const demand = await demandService.createStudentDemand(req.user!.id, {
    wardId: Number(wardId),
    universityId: universityId ? String(universityId) : undefined,
    minPrice: Number(minPrice),
    maxPrice: Number(maxPrice),
    roomType,
    isLookingForRoommate: isLookingForRoommate === true || isLookingForRoommate === 'true',
    roommateGender,
    rommateCriteria,
    amenityIds: normalizeAmenityIds(amenityIds ?? demandAmenities)
  });

  sendSuccess(res, HttpStatus.CREATED, demand, 'Student demand submitted successfully');
};

const normalizeAmenityIds = (value: unknown): number[] => {
  if (value === undefined || value === null) {
    return [];
  }

  const rawValues = Array.isArray(value) ? value : String(value).split(',');

  return Array.from(
    new Set(
      rawValues
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  );
};
