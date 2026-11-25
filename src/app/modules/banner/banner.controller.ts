import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import {
  ICreateBannerPayload,
  IUpdateBannerPayload,
} from './banner.interface';
import { BannerService } from './banner.service';

const getActiveBanners = catchAsync(async (_req: Request, res: Response) => {
  const banners = await BannerService.getActiveBanners();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Active banners retrieved successfully',
    data: banners,
  });
});

const getAllBannersAdmin = catchAsync(async (_req: Request, res: Response) => {
  const banners = await BannerService.getAllBannersAdmin();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'All banners retrieved successfully',
    data: banners,
  });
});

const createBanner = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as ICreateBannerPayload;
  const banner = await BannerService.createBanner(payload, req.file);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Banner created successfully',
    data: banner,
  });
});

const updateBanner = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const payload = req.body as IUpdateBannerPayload;
  const banner = await BannerService.updateBanner(id, payload, req.file);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Banner updated successfully',
    data: banner,
  });
});

const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = await BannerService.deleteBanner(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Banner deleted successfully',
    data: deleted,
  });
});

export const BannerController = {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
};

