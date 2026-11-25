import status from 'http-status';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import AppError from '../../errors/AppError';
import {
  IAdminResponse,
  IJwtPayload,
  ILoginPayload,
} from './auth.interface';
import { Admin } from './auth.model';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

const loginAdmin = async (
  payload: ILoginPayload,
): Promise<{ accessToken: string; admin: IAdminResponse }> => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  const admin = await Admin.findOne({ email: normalizedEmail })
    .select('+password')
    .lean();

  if (!admin) {
    throw new AppError(status.UNAUTHORIZED, INVALID_CREDENTIALS_MESSAGE);
  }

  const isPasswordValid = await Admin.isPasswordMatched(
    payload.password,
    admin.password,
  );

  if (!isPasswordValid) {
    throw new AppError(status.UNAUTHORIZED, INVALID_CREDENTIALS_MESSAGE);
  }

  const jwtPayload: IJwtPayload = {
    userId: admin._id.toString(),
    email: admin.email,
    role: admin.role,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });

  const adminResponse: IAdminResponse = {
    _id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };

  return {
    accessToken,
    admin: adminResponse,
  };
};

const getCurrentAdmin = async (adminId: string): Promise<IAdminResponse> => {
  const admin = await Admin.findById(adminId).lean();

  if (!admin) {
    throw new AppError(status.UNAUTHORIZED, 'Unauthorized access');
  }

  return {
    _id: admin._id.toString(),
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};

export const AuthService = {
  loginAdmin,
  getCurrentAdmin,
};

