import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
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

const app: Application = express();

// ─── Global Middlewares ──────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ success: true, message: 'API is running successfully' });
});

// ─── API v1 Routes ───────────────────────────────────────────────────────────

// public routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/locations', locationRouter);

// private routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/demands', demandRouter);
app.use('/api/v1/evaluations', evaluationRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/notifications', notificationRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: { code: 404, message: 'Route not found' }
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use(errorHandler);

export default app;
