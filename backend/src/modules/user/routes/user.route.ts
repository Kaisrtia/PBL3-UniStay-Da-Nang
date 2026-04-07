import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';

const userRouter = Router();

// -- User Info --

// Get user info
userRouter.get(
  '/me',
  verifyToken,
  asyncHandler(userController.handleGetUserInfo)
);

// Setup profile
userRouter.patch(
  '/setup',
  verifyToken,
  asyncHandler(userController.handleSetupProfile)
);

// Update profile
userRouter.patch(
  '/update',
  verifyToken,
  asyncHandler(userController.handleUpdateProfile)
);

// Change password
userRouter.patch(
  '/password',
  verifyToken,
  asyncHandler(userController.handleChangePassword)
);

// -- User Management --

// Ban user
userRouter.patch(
  '/ban',
  verifyToken,
  authorize([account_role.ADMIN]),
  asyncHandler(userController.handleBanUser)
);

// Unban user
userRouter.patch(
  '/unban',
  verifyToken,
  authorize([account_role.ADMIN]),
  asyncHandler(userController.handleUnbanUser)
);

// -- Evaluation --

// Evaluate a host (Student only)
userRouter.post(
  '/evaluate',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(userController.handleCreateEvaluation)
);

// Evaluate system (Any authenticated user)
userRouter.post(
  '/system-feedback',
  verifyToken,
  authorize([account_role.USER]),
  asyncHandler(userController.handleCreateSystemFeedback)
);

export default userRouter;

