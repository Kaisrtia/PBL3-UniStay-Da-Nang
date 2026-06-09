import Joi from 'joi';

export const notificationIdParamSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};
