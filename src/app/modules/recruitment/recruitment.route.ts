import { Router } from 'express';
import auth from '../../middlewares/auth';
import { noStoreCache, publicCache } from '../../middlewares/cacheControl';
import validateRequest from '../../middlewares/validateRequest';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentValidation } from './recruitment.validation';

const router = Router();

router.get(
  '/',
  publicCache,
  validateRequest(RecruitmentValidation.listRecruitmentsQuerySchema),
  RecruitmentController.getActiveRecruitments,
);

router.get(
  '/admin/all',
  noStoreCache,
  auth('admin'),
  validateRequest(RecruitmentValidation.listRecruitmentsQuerySchema),
  RecruitmentController.getAllRecruitmentsAdmin,
);

router.get(
  '/:id',
  publicCache,
  validateRequest(RecruitmentValidation.recruitmentIdParamSchema),
  RecruitmentController.getRecruitmentById,
);

router.post(
  '/',
  noStoreCache,
  auth('admin'),
  validateRequest(RecruitmentValidation.createRecruitmentSchema),
  RecruitmentController.createRecruitment,
);

router.patch(
  '/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(RecruitmentValidation.updateRecruitmentSchema),
  RecruitmentController.updateRecruitment,
);

router.delete(
  '/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(RecruitmentValidation.recruitmentIdParamSchema),
  RecruitmentController.deleteRecruitment,
);

export const RecruitmentRoutes = router;

