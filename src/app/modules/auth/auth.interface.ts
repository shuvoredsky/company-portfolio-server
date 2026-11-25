import { Model } from 'mongoose';

export type TUserRole = 'admin';

export interface IAdmin {
  email: string;
  password: string;
  name: string;
  role: TUserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAuthUser {
  _id: string;
  email: string;
  name: string;
  role: TUserRole;
}

export interface IAdminResponse extends IAuthUser {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IJwtPayload {
  userId: string;
  email: string;
  role: TUserRole;
}

export interface IAdminModel extends Model<IAdmin> {
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}
