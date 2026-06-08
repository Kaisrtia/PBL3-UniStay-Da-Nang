import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as locationService from '../service/location.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';



export const handleGetAllWards = async (_req: Request, res: Response) => {
  const wards = await locationService.getAllWards();
  sendSuccess(res, HttpStatus.OK, wards);
};

export const handleGetWard = async (req: Request, res: Response) => {
  const { id } = req.params;
  const wardId = Number(id);

  if (!Number.isInteger(wardId) || wardId <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Valid Ward ID is required');
  }

  const ward = await locationService.getWardById(wardId);
  sendSuccess(res, HttpStatus.OK, ward);
};

export const handleGetAllUniversities = async (_req: Request, res: Response) => {
  const universities = await locationService.getAllUniversities();
  sendSuccess(res, HttpStatus.OK, universities);
};

export const handleGetUniversitiesByWard = async (req: Request, res: Response) => {
  const { wardId } = req.params;
  const parsedWardId = Number(wardId);

  if (!Number.isInteger(parsedWardId) || parsedWardId <= 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Valid Ward ID is required');
  }

  const universities = await locationService.getUniversitiesByWard(parsedWardId);
  sendSuccess(res, HttpStatus.OK, universities);
};

export const handleGetUniversity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const universityId = id?.trim();

  if (!universityId) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'University ID is required');
  }

  const university = await locationService.getUniversityById(universityId);
  sendSuccess(res, HttpStatus.OK, university);
};
