import Joi from 'joi';
import { report_status } from '@prisma/client';

export const tackleReportSchema = {
  params: Joi.object({
    id: Joi.string().trim().min(1).max(64).required()
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(report_status.RESOLVED, report_status.REJECTED)
      .required(),
    adminNote: Joi.string().trim().max(2000).allow('').optional()
  })
};

export const createReportSchema = {
  body: Joi.object({
    reason: Joi.string().trim().min(1).max(2000).required(),
    postId: Joi.string().trim().min(1).max(30).optional(),
    commentId: Joi.string().trim().min(1).max(30).optional()
  }).xor('postId', 'commentId')
};
