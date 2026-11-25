import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import status from 'http-status';
import mongoose from 'mongoose';
import morgan from 'morgan';
import config from './config';
import AppError from './app/errors/AppError';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import sanitizeNoSql from './app/middlewares/sanitizeNoSql';
import router from './app/routes';
import sendResponse from './app/utils/sendResponse';

const app: Application = express();

app.disable('x-powered-by');

if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError(status.FORBIDDEN, 'Not allowed by CORS'));
    },
    credentials: true,
  }),
);

const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(status.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      errorSources: [
        {
          path: 'rateLimit',
          message: 'Global rate limit exceeded (200 requests per 15 minutes).',
        },
      ],
    });
  },
});

app.use('/api', globalApiLimiter);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeNoSql);

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/v1/health', (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Server is running smoothly',
    data: {
      status: 'ok',
      environment: config.nodeEnv,
      uptime: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
      database:
        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

app.use('/api/v1', router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
