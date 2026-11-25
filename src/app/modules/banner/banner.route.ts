import { Router } from 'express';
import auth from '../../middlewares/auth';
import { noStoreCache, publicCache } from '../../middlewares/cacheControl';
import { uploadSingleImage } from '../../middlewares/upload';
import validateRequest from '../../middlewares/validateRequest';
import { BannerController } from './banner.controller';
import { BannerValidation } from './banner.validation';

const router = Router();

router.get('/', publicCache, BannerController.getActiveBanners);

router.get(
  '/admin/all',
  noStoreCache,
  auth('admin'),
  BannerController.getAllBannersAdmin,
);

router.post(
  '/',
  noStoreCache,
  auth('admin'),
  uploadSingleImage,
  validateRequest(BannerValidation.createBannerSchema),
  BannerController.createBanner,
);

router.patch(
  '/:id',
  noStoreCache,
  auth('admin'),
  uploadSingleImage,
  validateRequest(BannerValidation.updateBannerSchema),
  BannerController.updateBanner,
);

router.delete(
  '/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(BannerValidation.bannerIdParamSchema),
  BannerController.deleteBanner,
);

export const BannerRoutes = router;

