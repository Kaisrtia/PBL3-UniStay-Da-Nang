import Joi from 'joi';

const commentId = Joi.string().trim().min(1).max(30).required();

export const createCommentSchema = {
  body: Joi.object({
    postId: Joi.string().trim().min(1).max(30).required(),
    content: Joi.string().trim().min(1).max(2000).required(),
    parentId: Joi.string().trim().min(1).max(30).optional()
  })
};

export const updateCommentSchema = {
  params: Joi.object({ id: commentId }),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(2000).required()
  })
};

export const commentIdParamSchema = {
  params: Joi.object({ id: commentId })
};
