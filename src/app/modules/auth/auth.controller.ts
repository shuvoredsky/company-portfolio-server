import { CookieOptions, Request, Response } from 'express';
import status from 'http-status';
import config, { parseDurationToMs } from '../../../config';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ILoginPayload } from './auth.interface';
import { AuthService } from './auth.service';

export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';

const getBaseCookieOptions = (): CookieOptions => {
  const isProduction = config.nodeEnv === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
};

const login = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as ILoginPayload;
  const { accessToken, admin } = await AuthService.loginAdmin(payload);

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    ...getBaseCookieOptions(),
    maxAge: parseDurationToMs(config.jwt.expiresIn),
  });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Logged in successfully',
    data: admin,
  });
});

const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, getBaseCookieOptions());

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, 'You are not authorized');
  }

  const admin = await AuthService.getCurrentAdmin(req.user._id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Admin profile retrieved successfully',
    data: admin,
  });
});

export const AuthController = {
  login,
  logout,
  getMe,
};
