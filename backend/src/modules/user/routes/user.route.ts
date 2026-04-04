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

export default userRouter;
