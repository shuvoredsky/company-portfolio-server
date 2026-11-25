import { Router } from 'express';
import auth from '../../middlewares/auth';
import { noStoreCache, publicCache } from '../../middlewares/cacheControl';
import { uploadSingleImage } from '../../middlewares/upload';
import validateRequest from '../../middlewares/validateRequest';
import { BlogController } from './blog.controller';
import { BlogValidation } from './blog.validation';

const router = Router();

router.get(
  '/',
  publicCache,
  validateRequest(BlogValidation.listBlogsQuerySchema),
  BlogController.getAllBlogs,
);

router.get(
  '/:id',
  publicCache,
  validateRequest(BlogValidation.blogIdParamSchema),
  BlogController.getBlogById,
);

router.post(
  '/',
  noStoreCache,
  auth('admin'),
  uploadSingleImage,
  validateRequest(BlogValidation.createBlogSchema),
  BlogController.createBlog,
);

router.patch(
  '/:id',
  noStoreCache,
  auth('admin'),
  uploadSingleImage,
  validateRequest(BlogValidation.updateBlogSchema),
  BlogController.updateBlog,
);

router.delete(
  '/:id',
  noStoreCache,
  auth('admin'),
  validateRequest(BlogValidation.blogIdParamSchema),
  BlogController.deleteBlog,
);

export const BlogRoutes = router;

