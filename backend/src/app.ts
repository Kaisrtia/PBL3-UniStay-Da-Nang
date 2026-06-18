import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import config from './core/config/config';
import authRouter from './modules/auth/routes/auth.route';
import { errorHandler } from './core/middlewares/error.handler';
import userRouter from './modules/user/routes/user.route';
import postRouter from './modules/post/routes/post.route';
import demandRouter from './modules/demand/routes/demand.route';
import evaluationRouter from './modules/evaluation/routes/evaluation.route';
import reportRouter from './modules/report/routes/report.route';
import commentRouter from './modules/comment/routes/comment.route';
import locationRouter from './modules/location/routes/location.route';
import notificationRouter from './modules/notification/routes/notification.route';
import amenityRouter from './modules/amenity/routes/amenity.route';
import prismaClient from './core/config/prisma';
import { cacheConnection } from './core/config/redis.connection';

const app: Application = express();

app.set('trust proxy', 1);

// ─── Global Middlewares ──────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.frontend_origin,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan(config.node_env === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/api/v1/health', async (_req: Request, res: Response) => {
  try {
    await Promise.all([
      prismaClient.$queryRaw`SELECT 1`,
      cacheConnection.ping()
    ]);
    res
      .status(200)
      .json({ success: true, message: 'API is ready' });
  } catch {
    res.status(503).json({
      success: false,
      error: { code: 503, message: 'API is not ready' }
    });
  }
});

// ─── API v1 Routes ───────────────────────────────────────────────────────────

// public routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/locations', locationRouter);
app.use('/api/v1/amenities', amenityRouter);

// private routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/demands', demandRouter);
app.use('/api/v1/evaluations', evaluationRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/notifications', notificationRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 404, message: 'Route not found' }
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use(errorHandler);

export default app;
