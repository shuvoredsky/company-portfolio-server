import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ICreateBlogPayload, IUpdateBlogPayload } from './blog.interface';
import { BlogService } from './blog.service';

const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const search =
    typeof req.query.search === 'string' ? req.query.search : undefined;

  const result = await BlogService.getAllBlogs({ page, limit, search });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Blogs retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getBlogById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const blog = await BlogService.getBlogById(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Blog post retrieved successfully',
    data: blog,
  });
});

const createBlog = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as ICreateBlogPayload;
  const blog = await BlogService.createBlog(payload, req.file);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Blog post created successfully',
    data: blog,
  });
});

const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const payload = req.body as IUpdateBlogPayload;
  const blog = await BlogService.updateBlog(id, payload, req.file);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Blog post updated successfully',
    data: blog,
  });
});

const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = await BlogService.deleteBlog(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Blog post deleted successfully',
    data: deleted,
  });
});

export const BlogController = {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
};

