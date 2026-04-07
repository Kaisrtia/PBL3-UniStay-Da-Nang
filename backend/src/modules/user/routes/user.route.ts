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

// -- Student Demands --

// Create or update accommodation demand (Student only)
userRouter.post(
  '/demand',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(userController.handleCreateStudentDemand)
);

// -- Favourite Posts --

// Add a post to favourites (Student only)
userRouter.post(
  '/favourites',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(userController.handleAddFavouritePost)
);

// Remove a post from favourites (Student only)
userRouter.delete(
  '/favourites/:postId',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(userController.handleRemoveFavouritePost)
);

// -- Accommodation Requests --

// Submit a shared accommodation request (Student only)
userRouter.post(
  '/accommodation-requests',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(userController.handleCreateAccommodationRequest)
);

export default userRouter;

