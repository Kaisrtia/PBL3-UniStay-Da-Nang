import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as demandService from '../service/demand.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';
import { demand_criterion_priority } from '@prisma/client';

// -- Student Actions --

export const handleGetStudentDemand = async (req: Request, res: Response) => {
  const demand = await demandService.getStudentDemand(req.user!.id);

  sendSuccess(res, HttpStatus.OK, demand, 'Student demand fetched successfully');
};

export const handleCreateStudentDemand = async (req: Request, res: Response) => {
  const {
    wardId,
    universityId,
    locationRadiusMeters,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    roomType,
    isLookingForRoommate,
    roommateGender,
    rommateCriteria,
    pricePriority,
    locationPriority,
    areaPriority,
    roommatePriority,
    roomTypePriority,
    amenityPriority,
    amenityIds,
    demandAmenities
  } = req.body;

  if (
    !universityId ||
    locationRadiusMeters === undefined ||
    minPrice === undefined ||
    maxPrice === undefined ||
    !roomType
  ) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'universityId, locationRadiusMeters, minPrice, maxPrice, and roomType are required'
    );
  }

  const parsedWardId = parseOptionalNumber(wardId);
  const parsedLocationRadiusMeters = Number(locationRadiusMeters);
  const parsedMinPrice = Number(minPrice);
  const parsedMaxPrice = Number(maxPrice);
  const parsedMinArea = parseOptionalNumber(minArea);
  const parsedMaxArea = parseOptionalNumber(maxArea);

  if (
    (parsedWardId !== undefined &&
      (!Number.isInteger(parsedWardId) || parsedWardId <= 0)) ||
    !Number.isInteger(parsedLocationRadiusMeters) ||
    parsedLocationRadiusMeters <= 0 ||
    !Number.isFinite(parsedMinPrice) ||
    !Number.isFinite(parsedMaxPrice) ||
    (parsedMinArea !== undefined && !Number.isFinite(parsedMinArea)) ||
    (parsedMaxArea !== undefined && !Number.isFinite(parsedMaxArea))
  ) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid demand numeric values');
  }

  const demand = await demandService.createStudentDemand(req.user!.id, {
    wardId: parsedWardId,
    universityId: String(universityId),
    locationRadiusMeters: parsedLocationRadiusMeters,
    minPrice: parsedMinPrice,
    maxPrice: parsedMaxPrice,
    minArea: parsedMinArea,
    maxArea: parsedMaxArea,
    roomType,
    isLookingForRoommate: isLookingForRoommate === true || isLookingForRoommate === 'true',
    roommateGender,
    rommateCriteria,
    pricePriority: normalizePriority(pricePriority),
    locationPriority: normalizePriority(locationPriority),
    areaPriority: normalizePriority(areaPriority),
    roommatePriority: normalizePriority(roommatePriority),
    roomTypePriority: normalizePriority(roomTypePriority),
    amenityPriority: normalizePriority(amenityPriority),
    amenityIds: normalizeAmenityIds(amenityIds ?? demandAmenities)
  });

  sendSuccess(res, HttpStatus.CREATED, demand, 'Student demand submitted successfully');
};

const normalizeAmenityIds = (value: unknown): number[] => {
  if (value === undefined || value === null) {
    return [];
  }

  const rawValues = Array.isArray(value) ? value : String(value).split(',');
  const parsedValues = rawValues.map((item) => Number(item));

  if (!parsedValues.every((item) => Number.isInteger(item) && item > 0)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid amenity IDs');
  }

  return Array.from(
    new Set(
      parsedValues
    )
  );
};

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
};

const normalizePriority = (
  value: unknown
): demand_criterion_priority | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalizedValue = String(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  const priorityMap: Record<string, demand_criterion_priority> = {
    LOW: demand_criterion_priority.LOW,
    THAP: demand_criterion_priority.LOW,
    MEDIUM: demand_criterion_priority.MEDIUM,
    TRUNG_BINH: demand_criterion_priority.MEDIUM,
    HIGH: demand_criterion_priority.HIGH,
    CAO: demand_criterion_priority.HIGH
  };

  const priority = priorityMap[normalizedValue];
  if (!priority) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid demand priority');
  }

  return priority;
};
