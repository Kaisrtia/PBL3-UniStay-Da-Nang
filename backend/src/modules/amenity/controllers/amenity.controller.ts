import { Request, Response } from 'express';
import HttpStatus from 'http-status';
import * as amenityService from '../service/amenity.service';
import { sendSuccess } from '../../../core/utils/response.handler';

export const handleGetAllAmenities = async (_req: Request, res: Response) => {
  const amenities = await amenityService.getAllAmenities();
  sendSuccess(res, HttpStatus.OK, amenities);
};
