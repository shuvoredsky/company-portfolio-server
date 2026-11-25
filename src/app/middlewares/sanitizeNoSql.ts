import { NextFunction, Request, RequestHandler, Response } from 'express';
import status from 'http-status';
import AppError from '../errors/AppError';

const hasProhibitedKey = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some((item) => hasProhibitedKey(item));
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.') || key.includes('[$')) {
        return true;
      }
      if (hasProhibitedKey(nested)) {
        return true;
      }
    }
  }

  return false;
};

const sanitizeNoSql: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (
    hasProhibitedKey(req.body) ||
    hasProhibitedKey(req.query) ||
    hasProhibitedKey(req.params)
  ) {
    next(
      new AppError(
        status.BAD_REQUEST,
        'Invalid characters detected in request input',
      ),
    );
    return;
  }

  next();
};

export default sanitizeNoSql;
