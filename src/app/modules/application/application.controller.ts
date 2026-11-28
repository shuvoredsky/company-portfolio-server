import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import {
  ICreateApplicationPayload,
  TApplicationStatus,
  IUpdateApplicationPayload,
} from './application.interface';
import { ApplicationService } from './application.service';

const getAllApplicationsAdmin = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const statusFilter =
    typeof req.query.status === 'string'
      ? (req.query.status as TApplicationStatus)
      : undefined;
  const search =
    typeof req.query.search === 'string' ? req.query.search : undefined;

  const result = await ApplicationService.getAllApplicationsAdmin({
    page,
    limit,
    status: statusFilter,
    search,
  });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Applications retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getApplicationByIdAdmin = catchAsync(async (req, res) => {
  const id = String(req.params.id);
  const result = await ApplicationService.getApplicationByIdAdmin(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Application retrieved successfully',
    data: result,
  });
});

const createApplication = catchAsync(async (req, res) => {
  const payload = req.body as ICreateApplicationPayload;
  const result = await ApplicationService.createApplication(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Application created successfully',
    data: result,
  });
});

const updateApplication = catchAsync(async (req, res) => {
  const id = String(req.params.id);
  const payload = req.body as IUpdateApplicationPayload;
  const result = await ApplicationService.updateApplication(id, payload);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Application updated successfully',
    data: result,
  });
});

const deleteApplication = catchAsync(async (req, res) => {
  const id = String(req.params.id);
  const result = await ApplicationService.deleteApplication(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Application deleted successfully',
    data: result,
  });
});

const checkApplicationStatusPublic = catchAsync(async (req, res) => {
  const { serialNumber } = req.body as { serialNumber: string };
  const result =
    await ApplicationService.checkApplicationStatusPublic(serialNumber);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Application status retrieved successfully',
    data: result,
  });
});

export const ApplicationController = {
  getAllApplicationsAdmin,
  getApplicationByIdAdmin,
  createApplication,
  updateApplication,
  deleteApplication,
  checkApplicationStatusPublic,
};

