import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';

const reportRouter = Router();

// Admin tackle report
reportRouter.patch(
  '/:id/tackle',
  verifyToken,
  authorize([account_role.ADMIN]),
  asyncHandler(reportController.handleTackleReport)
);

// User create report
reportRouter.post(
  '/',
  verifyToken,
  authorize([account_role.USER]),
  asyncHandler(reportController.handleCreateReport)
);

export default reportRouter;
