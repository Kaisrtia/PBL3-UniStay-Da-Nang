import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';
import { validate } from '../../../core/middlewares/validate.middleware';
import {
  adminUserActionSchema,
  blockedUserParamSchema,
  blockUserSchema,
  changePasswordSchema,
  hostReviewSchema,
  publicUserParamSchema,
  setupProfileSchema,
  updateProfileSchema,
  verifyHostSchema
} from '../user.validation';

const userRouter = Router();

// -- User Management --

// Get all users (Admin Only)
userRouter.get(
  '/',
  verifyToken,
  authorize([account_role.ADMIN]),
  asyncHandler(userController.handleGetAllUsers)
);

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
  validate(setupProfileSchema),
  asyncHandler(userController.handleSetupProfile)
);

// Update profile
userRouter.patch(
  '/update',
  verifyToken,
  validate(updateProfileSchema),
  asyncHandler(userController.handleUpdateProfile)
);

// Change password
userRouter.patch(
  '/password',
  verifyToken,
  validate(changePasswordSchema),
  asyncHandler(userController.handleChangePassword)
);

// -- Block Users --

userRouter.get(
  '/blocks',
  verifyToken,
  authorize([account_role.STUDENT, account_role.HOST, account_role.USER]),
  asyncHandler(userController.handleGetBlockedUsers)
);

userRouter.post(
  '/blocks',
  verifyToken,
  authorize([account_role.STUDENT, account_role.HOST, account_role.USER]),
  validate(blockUserSchema),
  asyncHandler(userController.handleBlockUser)
);

userRouter.delete(
  '/blocks/:blockedId',
  verifyToken,
  authorize([account_role.STUDENT, account_role.HOST, account_role.USER]),
  validate(blockedUserParamSchema),
  asyncHandler(userController.handleUnblockUser)
);

// -- User Management --

// Ban user
userRouter.patch(
  '/ban',
  verifyToken,
  authorize([account_role.ADMIN]),
  validate(adminUserActionSchema),
  asyncHandler(userController.handleBanUser)
);

// Unban user
userRouter.patch(
  '/unban',
  verifyToken,
  authorize([account_role.ADMIN]),
  validate(adminUserActionSchema),
  asyncHandler(userController.handleUnbanUser)
);

// Verify Host (Grant Blue Tick)
userRouter.patch(
  '/hosts/verify',
  verifyToken,
  authorize([account_role.ADMIN]),
  validate(verifyHostSchema),
  asyncHandler(userController.handleVerifyHost)
);

// Get Verification Candidates (Admin Only)
userRouter.get(
  '/hosts/verification-candidates',
  verifyToken,
  authorize([account_role.ADMIN]),
  asyncHandler(userController.handleGetVerificationCandidates)
);

// -- Public User Read --

// Create or update a review for a Host
userRouter.post(
  '/:id/reviews',
  verifyToken,
  authorize([account_role.STUDENT, account_role.HOST, account_role.USER]),
  validate(hostReviewSchema),
  asyncHandler(userController.handleCreateHostReview)
);

// Get public profile (MUST be at bottom to prevent overriding static routes like /me or /setup)
userRouter.get(
  '/:id',
  validate(publicUserParamSchema),
  asyncHandler(userController.handleGetUserProfile)
);

export default userRouter;
