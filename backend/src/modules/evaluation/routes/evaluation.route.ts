import { Router } from 'express';
import * as evaluationController from '../controllers/evaluation.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';
import { validate } from '../../../core/middlewares/validate.middleware';
import { systemFeedbackSchema } from '../evaluation.validation';

const evaluationRouter = Router();

// Evaluate system (Any authenticated user)
evaluationRouter.post(
  '/system-feedback',
  verifyToken,
  authorize([
    account_role.USER,
    account_role.STUDENT,
    account_role.HOST,
    account_role.ADMIN
  ]),
  validate(systemFeedbackSchema),
  asyncHandler(evaluationController.handleCreateSystemFeedback)
);

export default evaluationRouter;
