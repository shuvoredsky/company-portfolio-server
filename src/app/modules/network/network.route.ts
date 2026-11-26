import { Router } from 'express';
import auth from '../../middlewares/auth';
import { noStoreCache, publicCache } from '../../middlewares/cacheControl';
import { uploadSingleImage } from '../../middlewares/upload';
import validateRequest from '../../middlewares/validateRequest';
import { NetworkController } from './network.controller';
import { NetworkValidation } from './network.validation';

const router = Router();

router.get(
  '/',
  publicCache,
  validateRequest(NetworkValidation.listNetworksQuerySchema),
  NetworkController.getAllNetworks,
);

router.get(
  '/admin/all',
  noStoreCache,
  auth('admin'),
  validateRequest(NetworkValidation.listNetworksQuerySchema),
  NetworkController.getAllNetworks,
);

router.get(
  '/admin/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(NetworkValidation.networkIdParamSchema),
  NetworkController.getNetworkById,
);

router.get(
  '/:id',
  publicCache,
  validateRequest(NetworkValidation.networkIdParamSchema),
  NetworkController.getNetworkById,
);

router.post(
  '/',
  noStoreCache,
  auth('admin'),
  uploadSingleImage,
  validateRequest(NetworkValidation.createNetworkSchema),
  NetworkController.createNetwork,
);

router.patch(
  '/:id',
  noStoreCache,
  auth('admin'),
  uploadSingleImage,
  validateRequest(NetworkValidation.updateNetworkSchema),
  NetworkController.updateNetwork,
);

router.delete(
  '/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(NetworkValidation.networkIdParamSchema),
  NetworkController.deleteNetwork,
);

export const NetworkRoutes = router;

