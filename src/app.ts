import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import status from 'http-status';
import mongoose from 'mongoose';
import morgan from 'morgan';
import config from './config';
import AppError from './app/errors/AppError';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import router from './app/routes';
import sendResponse from './app/utils/sendResponse';

const app: Application = express();

if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

const allowedOrigins = [config.cors.clientUrl, config.cors.adminUrl].filter(
  Boolean,
);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError(status.FORBIDDEN, 'Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

