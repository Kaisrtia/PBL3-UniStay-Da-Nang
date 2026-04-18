import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as locationService from '../service/location.service';
import { sendSuccess } from '../../../core/utils/response.handler';
import { AppError } from '../../../core/exceptions/AppError';

export const handleGetAllDistricts = async (req: Request, res: Response) => {
  const districts = await locationService.getAllDistricts();
  sendSuccess(res, HttpStatus.OK, districts);
};

export const handleGetDistrict = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id || isNaN(Number(id))) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Valid District ID is required');
  }

  const district = await locationService.getDistrictById(Number(id));
  sendSuccess(res, HttpStatus.OK, district);
};

export const handleGetWardsByDistrict = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Valid District ID is required');
  }

  const wards = await locationService.getWardsByDistrict(Number(id));
  sendSuccess(res, HttpStatus.OK, wards);
};

export const handleGetWard = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Valid Ward ID is required');
  }

  const ward = await locationService.getWardById(Number(id));
  sendSuccess(res, HttpStatus.OK, ward);
};

export const handleGetAllUniversities = async (req: Request, res: Response) => {
  const universities = await locationService.getAllUniversities();
  sendSuccess(res, HttpStatus.OK, universities);
};

export const handleGetUniversitiesByWard = async (req: Request, res: Response) => {
  const { wardId } = req.params;

  if (!wardId || isNaN(Number(wardId))) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Valid Ward ID is required');
  }

  const universities = await locationService.getUniversitiesByWard(Number(wardId));
  sendSuccess(res, HttpStatus.OK, universities);
};

export const handleGetUniversity = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'University ID is required');
  }

  const university = await locationService.getUniversityById(id);
  sendSuccess(res, HttpStatus.OK, university);
};
