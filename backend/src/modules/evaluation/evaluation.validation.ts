import Joi from 'joi';

export const systemFeedbackSchema = {
  body: Joi.object({
    numberStar: Joi.number().integer().min(1).max(5).required(),
    description: Joi.string().trim().min(1).max(2000).required()
  })
};
