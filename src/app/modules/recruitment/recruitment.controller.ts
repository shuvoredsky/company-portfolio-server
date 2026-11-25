import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import {
  ICreateRecruitmentPayload,
  IUpdateRecruitmentPayload,
} from './recruitment.interface';
import { RecruitmentService } from './recruitment.service';

const parsePagination = (req: Request) => ({
  page: Number(req.query.page) || 1,
  limit: Math.min(Math.max(Number(req.query.limit) || 10, 1), 50),
});

const getActiveRecruitments = catchAsync(
  async (req: Request, res: Response) => {
    const result = await RecruitmentService.getActiveRecruitments(
      parsePagination(req),
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: 'Active recruitment posts retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  },
);

const getAllRecruitmentsAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const result = await RecruitmentService.getAllRecruitmentsAdmin(
      parsePagination(req),
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: 'All recruitment posts retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  },
);

const getRecruitmentById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const recruitment = await RecruitmentService.getRecruitmentById(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Recruitment post retrieved successfully',
    data: recruitment,
  });
});

const createRecruitment = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as ICreateRecruitmentPayload;
  const recruitment = await RecruitmentService.createRecruitment(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Recruitment post created successfully',
    data: recruitment,
  });
});

const updateRecruitment = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const payload = req.body as IUpdateRecruitmentPayload;
  const recruitment = await RecruitmentService.updateRecruitment(id, payload);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Recruitment post updated successfully',
    data: recruitment,
  });
});

const deleteRecruitment = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = await RecruitmentService.deleteRecruitment(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Recruitment post deleted successfully',
    data: deleted,
  });
});

export const RecruitmentController = {
  getActiveRecruitments,
  getAllRecruitmentsAdmin,
  getRecruitmentById,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
};

