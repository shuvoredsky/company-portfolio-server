import { NextFunction, Request, Response } from 'express';
import status from 'http-status';

const notFound = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(status.NOT_FOUND).json({
    success: false,
    message: 'API route not found',
    errorSources: [
      {
        path: req.originalUrl,
        message: `Route ${req.method} ${req.originalUrl} not found`,
      },
    ],
  });
};

export default notFound;

