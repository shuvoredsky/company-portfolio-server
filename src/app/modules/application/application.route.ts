import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import status from 'http-status';
import auth from '../../middlewares/auth';
import { noStoreCache } from '../../middlewares/cacheControl';
import validateRequest from '../../middlewares/validateRequest';
import { ApplicationController } from './application.controller';
import { ApplicationValidation } from './application.validation';

const router = Router();

const applicationCheckRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(status.TOO_MANY_REQUESTS).json({
      success: false,
      message:
        'Too many status check attempts. Please wait 15 minutes and try again.',
      errorSources: [
        {
          path: 'rateLimit',
          message:
            'Maximum 15 application status checks per 15 minutes allowed from this IP.',
        },
      ],
    });
  },
});

// Public status check (POST so serial numbers never appear in URLs or access logs)
router.post(
  '/check',
  noStoreCache,
  applicationCheckRateLimiter,
  validateRequest(ApplicationValidation.checkApplicationStatusSchema),
  ApplicationController.checkApplicationStatusPublic,
);

// Admin static routes before /:id
router.get(
  '/admin/all',
  noStoreCache,
  auth('admin'),
  validateRequest(ApplicationValidation.listApplicationsQuerySchema),
  ApplicationController.getAllApplicationsAdmin,
);

router.get(
  '/admin/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(ApplicationValidation.applicationIdParamSchema),
  ApplicationController.getApplicationByIdAdmin,
);

router.post(
  '/',
  noStoreCache,
  auth('admin'),
  validateRequest(ApplicationValidation.createApplicationSchema),
  ApplicationController.createApplication,
);

router.patch(
  '/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(ApplicationValidation.updateApplicationSchema),
  ApplicationController.updateApplication,
);

router.delete(
  '/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(ApplicationValidation.applicationIdParamSchema),
  ApplicationController.deleteApplication,
);

export const ApplicationRoutes = router;

