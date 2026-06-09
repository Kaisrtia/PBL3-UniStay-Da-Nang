import Joi from 'joi';
import { account_role } from '@prisma/client';

const userId = Joi.string().trim().min(1).max(64).required();
const phone = Joi.string().trim().pattern(/^\d{10}$/);

export const setupProfileSchema = {
  body: Joi.object({
    role: Joi.string()
      .valid(account_role.STUDENT, account_role.HOST)
      .required(),
    dob: Joi.date().iso().required(),
    phone: phone.required(),
    gender: Joi.string().trim().max(10).optional(),
    universityId: Joi.string().trim().max(10).when('role', {
      is: account_role.STUDENT,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
};

export const updateProfileSchema = {
  body: Joi.object({
    full_name: Joi.string().trim().min(1).max(100).optional(),
    fullName: Joi.string().trim().min(1).max(100).optional(),
    phone: phone.optional(),
    dob: Joi.date().iso().optional(),
    gender: Joi.string().trim().max(10).optional(),
    avatarUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .max(2048)
      .optional(),
    universityId: Joi.string().trim().max(10).optional()
  }).min(1)
};

export const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().max(72).required(),
    newPassword: Joi.string().min(8).max(72).required()
  })
};

export const blockUserSchema = {
  body: Joi.object({ blockedId: userId })
};

export const blockedUserParamSchema = {
  params: Joi.object({ blockedId: userId })
};

export const adminUserActionSchema = {
  body: Joi.object({ userId })
};

export const verifyHostSchema = {
  body: Joi.object({ hostId: userId })
};

export const publicUserParamSchema = {
  params: Joi.object({ id: userId })
};

export const hostReviewSchema = {
  params: Joi.object({ id: userId }),
  body: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().min(1).max(2000).required()
  })
};
