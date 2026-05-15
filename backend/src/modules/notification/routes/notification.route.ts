import { Router } from 'express';
import { sseHandler } from '../../../core/utils/sse.handler';
import { asyncHandler } from '../../../core/middlewares/async.handler';
import { verifyToken } from '../../../core/middlewares/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const notificationRouter = Router();

notificationRouter.get(
  '/',
  verifyToken,
  asyncHandler(notificationController.handleGetNotifications)
);

notificationRouter.patch(
  '/read-all',
  verifyToken,
  asyncHandler(notificationController.handleMarkAllNotificationsAsRead)
);

notificationRouter.patch(
  '/:id/read',
  verifyToken,
  asyncHandler(notificationController.handleMarkNotificationAsRead)
);

notificationRouter.get(
  '/sse',
  sseHandler
);

export default notificationRouter;
