import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';

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


export default userRouter;
