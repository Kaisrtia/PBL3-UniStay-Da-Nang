import { Router } from 'express';
import * as demandController from '../controllers/demand.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';

const demandRouter = Router();

// -- Student Demands --

// Create or update accommodation demand (Student only)
demandRouter.post(
  '/',
  verifyToken,
  authorize([account_role.STUDENT]),
  asyncHandler(demandController.handleCreateStudentDemand)
);

export default demandRouter;
