import Joi from 'joi';
import {
  room_type,
  post_purpose,
  post_status,
  amenity_condition
} from '@prisma/client';

export const createPostSchema = {
  body: Joi.object({
    title: Joi.string().required(),
    wardId: Joi.number().integer().required(),
    purpose: Joi.string().valid('RENT', 'FIND_ROOMMATE').required(),
    detailAddress: Joi.string().required(),
    exactAddress: Joi.string().optional(),
    district: Joi.string().optional(),
    city: Joi.string().optional(),
    area: Joi.number().positive().required(),
    price: Joi.number().min(0).required(),
    deposit: Joi.number().min(0).required(),
    roomType: Joi.string()
      .valid(...Object.values(room_type))
      .required(),
    postPurpose: Joi.string()
      .valid(...Object.values(post_purpose))
      .required(),
    description: Joi.string().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    postImages: Joi.array().items(Joi.string().uri()).optional(),
    postAmenities: Joi.array()
      .items(
        Joi.object({
          amenityId: Joi.number().integer().required(),
          currentCondition: Joi.string()
            .valid(...Object.values(amenity_condition))
            .optional()
        })
      )
      .optional()
  })
};

export const updatePostSchema = {
  params: Joi.object({
    postId: Joi.string().required()
  }),
  body: Joi.object({
    title: Joi.string().optional(),
    wardId: Joi.number().integer().optional(),
    purpose: Joi.string().valid('RENT', 'FIND_ROOMMATE').optional(),
    detailAddress: Joi.string().optional(),
    exactAddress: Joi.string().optional(),
    district: Joi.string().optional(),
    city: Joi.string().optional(),
    area: Joi.number().positive().optional(),
    price: Joi.number().min(0).optional(),
    deposit: Joi.number().min(0).optional(),
    roomType: Joi.string()
      .valid(...Object.values(room_type))
      .optional(),
    postPurpose: Joi.string()
      .valid(...Object.values(post_purpose))
      .optional(),
    description: Joi.string().optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    postImages: Joi.array().items(Joi.string().uri()).optional(),
    postAmenities: Joi.array()
      .items(
        Joi.object({
          amenityId: Joi.number().integer().required(),
          currentCondition: Joi.string()
            .valid(...Object.values(amenity_condition))
            .optional()
        })
      )
      .optional()
  })
};
