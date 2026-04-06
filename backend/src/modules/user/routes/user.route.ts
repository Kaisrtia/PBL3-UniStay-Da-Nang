import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';

const userRouter = Router();

// Setup profile
userRouter.patch(
  '/setup',
  verifyToken,
  asyncHandler(userController.handleSetupProfile)
);

// Change password
userRouter.patch(
  '/password',
  verifyToken,
  asyncHandler(userController.handleChangePassword)
);

// Ban user
userRouter.patch(
  '/ban',
  verifyToken,
  authorize([account_role.ADMIN]),
  asyncHandler(userController.handleBanUser)
);


export default userRouter;
