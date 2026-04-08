import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';

const commentRouter = Router();

// Create comment
commentRouter.post(
  '/',
  verifyToken,
  authorize([account_role.USER, account_role.STUDENT, account_role.HOST, account_role.ADMIN]),
  asyncHandler(commentController.handleCreateComment)
);

// Update comment
commentRouter.patch(
  '/:id',
  verifyToken,
  authorize([account_role.USER, account_role.STUDENT, account_role.HOST, account_role.ADMIN]),
  asyncHandler(commentController.handleUpdateComment)
);

// Hide comment
commentRouter.patch(
  '/:id/hide',
  verifyToken,
  authorize([account_role.USER, account_role.STUDENT, account_role.HOST, account_role.ADMIN]),
  asyncHandler(commentController.handleHideComment)
);

export default commentRouter;
