import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import status from 'http-status';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(status.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
      errorSources: [
        {
          path: 'rateLimit',
          message:
            'Too many login attempts from this IP. Please try again after 15 minutes.',
        },
      ],
    });
  },
});

router.post(
  '/login',
  loginRateLimiter,
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login,
);

router.post('/logout', AuthController.logout);

router.get('/me', auth('admin'), AuthController.getMe);

export const AuthRoutes = router;
