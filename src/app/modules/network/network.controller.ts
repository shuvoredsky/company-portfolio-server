import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import {
  ICreateNetworkPayload,
  IUpdateNetworkPayload,
} from './network.interface';
import { NetworkService } from './network.service';

const getAllNetworks = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const search =
    typeof req.query.search === 'string' ? req.query.search : undefined;

  const result = await NetworkService.getAllNetworks({ page, limit, search });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Networks retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getNetworkById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const network = await NetworkService.getNetworkById(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Network item retrieved successfully',
    data: network,
  });
});

const createNetwork = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as ICreateNetworkPayload;
  const network = await NetworkService.createNetwork(payload, req.file);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Network item created successfully',
    data: network,
  });
});

const updateNetwork = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const payload = req.body as IUpdateNetworkPayload;
  const network = await NetworkService.updateNetwork(id, payload, req.file);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Network item updated successfully',
    data: network,
  });
});

const deleteNetwork = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = await NetworkService.deleteNetwork(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Network item deleted successfully',
    data: deleted,
  });
});

export const NetworkController = {
  getAllNetworks,
  getNetworkById,
  createNetwork,
  updateNetwork,
  deleteNetwork,
};

