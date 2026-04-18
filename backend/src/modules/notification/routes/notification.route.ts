import { Router } from 'express';
import { sseHandler } from '../../../core/utils/sse.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import { authorize } from '../../../core/middlewares/role.middleware';
import { account_role } from '@prisma/client';

const notificationRouter = Router();

notificationRouter.get(
  '/sse',
  sseHandler
);

export default notificationRouter;
