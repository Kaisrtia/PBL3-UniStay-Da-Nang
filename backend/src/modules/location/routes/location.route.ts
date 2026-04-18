import { Router } from 'express';
import * as locationController from '../controllers/location.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';

const locationRouter = Router();

// -- Districts --

locationRouter.get(
  '/districts',
  asyncHandler(locationController.handleGetAllDistricts)
);

locationRouter.get(
  '/districts/:id',
  asyncHandler(locationController.handleGetDistrict)
);

// -- Wards --

locationRouter.get(
  '/districts/:id/wards',
  asyncHandler(locationController.handleGetWardsByDistrict)
);

locationRouter.get(
  '/wards/:id',
  asyncHandler(locationController.handleGetWard)
);

// -- Universities --

locationRouter.get(
  '/universities',
  asyncHandler(locationController.handleGetAllUniversities)
);

locationRouter.get(
  '/wards/:wardId/universities',
  asyncHandler(locationController.handleGetUniversitiesByWard)
);

locationRouter.get(
  '/universities/:id',
  asyncHandler(locationController.handleGetUniversity)
);

export default locationRouter;
