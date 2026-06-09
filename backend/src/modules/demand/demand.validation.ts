import Joi from 'joi';
import { demand_criterion_priority, room_type } from '@prisma/client';

const priority = Joi.string()
  .trim()
  .uppercase()
  .valid(
    ...Object.values(demand_criterion_priority),
    'THẤP',
    'THAP',
    'TRUNG BÌNH',
    'TRUNG_BINH',
    'CAO'
  );

export const studentDemandSchema = {
  body: Joi.object({
    wardId: Joi.number().integer().positive().optional(),
    universityId: Joi.string().trim().min(1).max(10).required(),
    locationRadiusMeters: Joi.number().integer().min(1).max(100000).required(),
    minPrice: Joi.number().min(0).required(),
    maxPrice: Joi.number().min(0).required(),
    minArea: Joi.number().positive().optional(),
    maxArea: Joi.number().positive().optional(),
    roomType: Joi.string().valid(...Object.values(room_type)).required(),
    isLookingForRoommate: Joi.boolean().optional(),
    roommateGender: Joi.string().trim().max(10).optional(),
    rommateCriteria: Joi.string().trim().max(2000).allow('').optional(),
    pricePriority: priority.optional(),
    locationPriority: priority.optional(),
    areaPriority: priority.optional(),
    roommatePriority: priority.optional(),
    roomTypePriority: priority.optional(),
    amenityPriority: priority.optional(),
    amenityIds: Joi.alternatives()
      .try(
        Joi.array().items(Joi.number().integer().positive()).max(100).unique(),
        Joi.string().max(1000)
      )
      .optional(),
    demandAmenities: Joi.alternatives()
      .try(
        Joi.array().items(Joi.number().integer().positive()).max(100).unique(),
        Joi.string().max(1000)
      )
      .optional()
  }).custom((value, helpers) => {
    if (value.minPrice > value.maxPrice) {
      return helpers.error('any.invalid', {
        message: 'minPrice must not exceed maxPrice'
      });
    }
    if (
      value.minArea !== undefined &&
      value.maxArea !== undefined &&
      value.minArea > value.maxArea
    ) {
      return helpers.error('any.invalid', {
        message: 'minArea must not exceed maxArea'
      });
    }
    return value;
  })
};
