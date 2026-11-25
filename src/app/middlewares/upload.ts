import { NextFunction, Request, RequestHandler, Response } from 'express';
import status from 'http-status';
import multer from 'multer';
import AppError from '../errors/AppError';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(
        new AppError(
          status.BAD_REQUEST,
          'Invalid image type. Only JPEG, PNG, and WebP images are allowed',
        ),
      );
      return;
    }

    callback(null, true);
  },
});

const singleImageMiddleware = upload.single('image');

export const uploadSingleImage: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  singleImageMiddleware(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(
          new AppError(
            status.BAD_REQUEST,
            'Image size must not exceed 5MB',
          ),
        );
        return;
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        next(
          new AppError(
            status.BAD_REQUEST,
            'Unexpected file field. Please upload under the "image" field',
          ),
        );
        return;
      }

      next(new AppError(status.BAD_REQUEST, err.message));
      return;
    }

    if (err instanceof AppError) {
      next(err);
      return;
    }

    next(
      new AppError(status.BAD_REQUEST, 'Failed to process uploaded image'),
    );
  });
};

