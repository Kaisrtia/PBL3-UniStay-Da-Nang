import { Router } from 'express';
import * as evaluationController from '../controllers/evaluation.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';

const evaluationRouter = Router();

// Evaluate a host (Student only)
evaluationRouter.post(
  '/host',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(evaluationController.handleCreateEvaluation)
);

// Evaluate system (Any authenticated user)
evaluationRouter.post(
  '/system-feedback',
  verifyToken,
  authorize([account_role.USER]),
  asyncHandler(evaluationController.handleCreateSystemFeedback)
);

export default evaluationRouter;
