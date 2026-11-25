import { ErrorRequestHandler } from 'express';
import status from 'http-status';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import config from '../../config';
import AppError, { TErrorSource } from '../errors/AppError';
import handleDuplicateError, {
  DuplicateKeyError,
} from '../errors/handleDuplicateError';
import handleMongooseError from '../errors/handleMongooseError';
import handleZodError from '../errors/handleZodError';

const isDuplicateKeyError = (err: unknown): err is DuplicateKeyError => {
  if (typeof err !== 'object' || err === null) {
    return false;
  }

  const record = err as Record<string, unknown>;
  if (record.code === 11000) {
    return true;
  }

  if (typeof record.cause === 'object' && record.cause !== null) {
    const causeRecord = record.cause as Record<string, unknown>;
    if (causeRecord.code === 11000) {
      return true;
    }
  }

  return false;
};

const globalErrorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';
  let errorSources: TErrorSource[] = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  if (err instanceof ZodError) {
    const simplified = handleZodError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.CastError
  ) {
    const simplified = handleMongooseError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (isDuplicateKeyError(err)) {
    const simplified = handleDuplicateError(err);
    statusCode = simplified.statusCode;
    message = simplified.message;
    errorSources = simplified.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message || 'Internal Server Error';
    errorSources = [
      {
        path: '',
        message: err.message || 'Internal Server Error',
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    ...(config.nodeEnv === 'development' && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};

export default globalErrorHandler;

