import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodType } from 'zod';
import catchAsync from '../utils/catchAsync';

const validateRequest = (schema: ZodType): RequestHandler => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const parsed: unknown = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
    });

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'body' in parsed &&
      parsed.body !== undefined
    ) {
      req.body = parsed.body;
    }

    next();
  });
};

export default validateRequest;

