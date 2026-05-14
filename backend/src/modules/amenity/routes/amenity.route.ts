import { Router } from 'express';
import * as amenityController from '../controllers/amenity.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';

const amenityRouter = Router();

amenityRouter.get(
  '/',
  asyncHandler(amenityController.handleGetAllAmenities)
);

export default amenityRouter;
