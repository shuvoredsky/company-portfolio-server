import { NextFunction, Request, RequestHandler, Response } from 'express';
import status from 'http-status';
import jwt from 'jsonwebtoken';
import config from '../../config';
import AppError from '../errors/AppError';
import { ACCESS_TOKEN_COOKIE_NAME } from '../modules/auth/auth.controller';
import { IJwtPayload, TUserRole } from '../modules/auth/auth.interface';
import { Admin } from '../modules/auth/auth.model';
import catchAsync from '../utils/catchAsync';

const isValidJwtPayload = (decoded: unknown): decoded is IJwtPayload => {
  if (typeof decoded !== 'object' || decoded === null) {
    return false;
  }

  const record = decoded as Record<string, unknown>;
  return (
    typeof record.userId === 'string' &&
    typeof record.email === 'string' &&
    record.role === 'admin'
  );
};

const auth = (...requiredRoles: TUserRole[]): RequestHandler => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const cookies = req.cookies as Record<string, unknown> | undefined;
      const token = cookies?.[ACCESS_TOKEN_COOKIE_NAME];

      if (typeof token !== 'string' || !token.trim()) {
        throw new AppError(status.UNAUTHORIZED, 'You are not authorized');
      }

      let decoded: unknown;
      try {
        decoded = jwt.verify(token, config.jwt.secret);
      } catch {
        throw new AppError(status.UNAUTHORIZED, 'Invalid or expired token');
      }

      if (!isValidJwtPayload(decoded)) {
        throw new AppError(status.UNAUTHORIZED, 'Invalid token payload');
      }

      const admin = await Admin.findById(decoded.userId).lean();

      if (!admin) {
        throw new AppError(status.UNAUTHORIZED, 'Unauthorized access');
      }

      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(admin.role)
      ) {
        throw new AppError(
          status.FORBIDDEN,
          'You do not have permission to perform this action',
        );
      }

      req.user = {
        _id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
      };

      next();
    },
  );
};

export default auth;

