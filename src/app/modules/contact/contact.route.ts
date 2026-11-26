import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import status from 'http-status';
import auth from '../../middlewares/auth';
import { noStoreCache } from '../../middlewares/cacheControl';
import validateRequest from '../../middlewares/validateRequest';
import { ContactController } from './contact.controller';
import { ContactValidation } from './contact.validation';

const router = Router();

const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(status.TOO_MANY_REQUESTS).json({
      success: false,
      message:
        'You have submitted too many messages. Please try again in an hour.',
      errorSources: [
        {
          path: 'rateLimit',
          message:
            'Maximum 5 contact submissions per hour allowed from this IP.',
        },
      ],
    });
  },
});

router.post(
  '/',
  noStoreCache,
  contactRateLimiter,
  validateRequest(ContactValidation.createContactSchema),
  ContactController.createContact,
);

router.get(
  '/',
  noStoreCache,
  auth('admin'),
  validateRequest(ContactValidation.listContactsQuerySchema),
  ContactController.getAllContacts,
);

router.get(
  '/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(ContactValidation.contactIdParamSchema),
  ContactController.getContactById,
);

router.patch(
  '/:id/read',
  noStoreCache,
  auth('admin'),
  validateRequest(ContactValidation.markReadSchema),
  ContactController.updateContactReadStatus,
);

router.delete(
  '/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(ContactValidation.contactIdParamSchema),
  ContactController.deleteContact,
);

export const ContactRoutes = router;

