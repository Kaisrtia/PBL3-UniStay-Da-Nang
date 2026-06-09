import Joi from 'joi';
import {
  room_type,
  post_purpose,
  amenity_condition,
  post_status
} from '@prisma/client';

const postId = Joi.string().trim().min(1).max(30).required();

export const createPostSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    wardId: Joi.number().integer().positive().required(),
    purpose: Joi.string().valid('RENT', 'FIND_ROOMMATE').required(),
    detailAddress: Joi.string().trim().min(1).max(1000).required(),
    exactAddress: Joi.string().trim().max(1000).optional(),
    district: Joi.string().trim().max(100).optional(),
    city: Joi.string().trim().max(100).optional(),
    area: Joi.number().positive().required(),
    price: Joi.number().min(0).required(),
    deposit: Joi.number().min(0).required(),
    roomType: Joi.string()
      .valid(...Object.values(room_type))
      .required(),
    postPurpose: Joi.string()
      .valid(...Object.values(post_purpose))
      .required(),
    description: Joi.string().trim().min(1).max(10000).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    postImages: Joi.array()
      .items(Joi.string().uri({ scheme: ['http', 'https'] }).max(2048))
      .max(10)
      .unique()
      .optional(),
    postAmenities: Joi.array()
      .items(
        Joi.object({
          amenityId: Joi.number().integer().positive().required(),
          currentCondition: Joi.string()
            .valid(...Object.values(amenity_condition))
            .optional()
        })
      )
      .max(100)
      .optional()
  })
};

export const updatePostSchema = {
  params: Joi.object({
    postId: Joi.string().required()
  }),
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255).optional(),
    wardId: Joi.number().integer().positive().optional(),
    purpose: Joi.string().valid('RENT', 'FIND_ROOMMATE').optional(),
    detailAddress: Joi.string().trim().min(1).max(1000).optional(),
    exactAddress: Joi.string().trim().max(1000).optional(),
    district: Joi.string().trim().max(100).optional(),
    city: Joi.string().trim().max(100).optional(),
    area: Joi.number().positive().optional(),
    price: Joi.number().min(0).optional(),
    deposit: Joi.number().min(0).optional(),
    roomType: Joi.string()
      .valid(...Object.values(room_type))
      .optional(),
    postPurpose: Joi.string()
      .valid(...Object.values(post_purpose))
      .optional(),
    description: Joi.string().trim().min(1).max(10000).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    postImages: Joi.array()
      .items(Joi.string().uri({ scheme: ['http', 'https'] }).max(2048))
      .max(10)
      .unique()
      .optional(),
    postAmenities: Joi.array()
      .items(
        Joi.object({
          amenityId: Joi.number().integer().positive().required(),
          currentCondition: Joi.string()
            .valid(...Object.values(amenity_condition))
            .optional()
        })
      )
      .max(100)
      .optional()
  }).min(1)
};

export const postIdParamSchema = {
  params: Joi.object({ postId })
};

export const censorPostSchema = {
  params: Joi.object({ postId }),
  body: Joi.object({
    status: Joi.string()
      .valid(post_status.APPROVED, post_status.REJECTED)
      .required(),
    rejectionReason: Joi.string().trim().min(1).max(2000).when('status', {
      is: post_status.REJECTED,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
};

export const favouritePostSchema = {
  body: Joi.object({ postId })
};

export const favouritePostParamSchema = {
  params: Joi.object({ postId })
};
