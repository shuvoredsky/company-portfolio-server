import { Response } from 'express';

export interface TMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: TMeta;
}

const sendResponse = <T>(res: Response, payload: TResponse<T>): void => {
  const responseBody: {
    success: boolean;
    message: string;
    meta?: TMeta;
    data: T | null;
  } = {
    success: payload.success,
    message: payload.message,
    ...(payload.meta !== undefined ? { meta: payload.meta } : {}),
    data: payload.data !== undefined ? payload.data : null,
  };

  res.status(payload.statusCode).json(responseBody);
};

export default sendResponse;

