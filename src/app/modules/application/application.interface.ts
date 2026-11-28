import { Document, Model } from 'mongoose';

export type TApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface IApplication {
  serialNumber: string;
  name: string;
  email: string;
  phone: string;
  note?: string;
  passportNumber?: string;
  visaStatus?: string;
  status: TApplicationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IApplicationDocument extends IApplication, Document {}

export type IApplicationModel = Model<IApplicationDocument>;

export interface IApplicationListQuery {
  page: number;
  limit: number;
  status?: TApplicationStatus;
  search?: string;
}

export interface ICreateApplicationPayload {
  serialNumber: string;
  name: string;
  email: string;
  phone: string;
  note?: string;
  passportNumber?: string;
  visaStatus?: string;
  status?: TApplicationStatus;
}

export interface IUpdateApplicationPayload {
  serialNumber?: string;
  name?: string;
  email?: string;
  phone?: string;
  note?: string;
  passportNumber?: string;
  visaStatus?: string;
  status?: TApplicationStatus;
}

export interface IPublicApplicationCheckResult {
  serialNumber: string;
  status: TApplicationStatus;
  maskedName: string;
  updatedAt: Date;
}

