import { NextFunction, Request, RequestHandler, Response } from 'express';

export const publicCache: RequestHandler = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.setHeader(
    'Cache-Control',
    'public, max-age=60, stale-while-revalidate=300',
  );
  next();
};

export const noStoreCache: RequestHandler = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};

