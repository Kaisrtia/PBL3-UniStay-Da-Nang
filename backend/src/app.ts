import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/routes/auth.route';
import { errorHandler } from './core/middlewares/error.handler';

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

app.use('/api/v1/auth', authRouter);

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
