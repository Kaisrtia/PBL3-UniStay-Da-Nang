import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';
import { validate } from '../../../core/middlewares/validate.middleware';
import {
  commentIdParamSchema,
  createCommentSchema,
  updateCommentSchema
} from '../comment.validation';

const commentRouter = Router();

// Create comment
commentRouter.post(
  '/',
  verifyToken,
  authorize([account_role.USER, account_role.STUDENT, account_role.HOST, account_role.ADMIN]),
  validate(createCommentSchema),
  asyncHandler(commentController.handleCreateComment)
);

// Update comment
commentRouter.patch(
  '/:id',
  verifyToken,
  authorize([account_role.USER, account_role.STUDENT, account_role.HOST, account_role.ADMIN]),
  validate(updateCommentSchema),
  asyncHandler(commentController.handleUpdateComment)
);

// Hide comment
commentRouter.patch(
  '/:id/hide',
  verifyToken,
  authorize([account_role.USER, account_role.STUDENT, account_role.HOST, account_role.ADMIN]),
  validate(commentIdParamSchema),
  asyncHandler(commentController.handleHideComment)
);

export default commentRouter;
