import { Router } from 'express';
import { sseHandler } from '../../../core/utils/sse.handler';

const notificationRouter = Router();

notificationRouter.get(
  '/sse',
  sseHandler
);

export default notificationRouter;
