import status from 'http-status';
import mongoose from 'mongoose';
import { TErrorSource, TGenericErrorResponse } from './AppError';

export const handleMongooseValidationError = (
  err: mongoose.Error.ValidationError,
): TGenericErrorResponse => {
  const errorSources: TErrorSource[] = Object.values(err.errors).map((val) => ({
    path: val.path,
    message: val.message,
  }));

  return {
    statusCode: status.BAD_REQUEST,
    message: 'Validation Error',
    errorSources,
  };
};

export const handleMongooseCastError = (
  err: mongoose.Error.CastError,
): TGenericErrorResponse => {
  const errorSources: TErrorSource[] = [
    {
      path: err.path,
      message: err.message,
    },
  ];

  return {
    statusCode: status.BAD_REQUEST,
    message: 'Invalid ID',
    errorSources,
  };
};

const handleMongooseError = (
  err: mongoose.Error.ValidationError | mongoose.Error.CastError,
): TGenericErrorResponse => {
  if (err instanceof mongoose.Error.ValidationError) {
    return handleMongooseValidationError(err);
  }
  return handleMongooseCastError(err);
};

export default handleMongooseError;

