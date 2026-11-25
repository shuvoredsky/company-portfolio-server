import status from 'http-status';
import AppError from '../../errors/AppError';
import { deleteImage, uploadImage } from '../../utils/cloudinary';
import { TMeta } from '../../utils/sendResponse';
import {
  IBlog,
  IBlogListQuery,
  ICreateBlogPayload,
  IUpdateBlogPayload,
} from './blog.interface';
import { Blog } from './blog.model';

const BLOG_FOLDER = 'company-portfolio/blogs';
const BLOG_PROJECTION = 'title description image createdAt updatedAt';

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getAllBlogs = async (
  query: IBlogListQuery,
): Promise<{ data: unknown[]; meta: TMeta }> => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (search && search.trim()) {
    filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .select(BLOG_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Blog.countDocuments(filter),
  ]);

  return {
    data: blogs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getBlogById = async (id: string) => {
  const blog = await Blog.findById(id).select(BLOG_PROJECTION).lean();

  if (!blog) {
    throw new AppError(status.NOT_FOUND, 'Blog post not found');
  }

  return blog;
};

const createBlog = async (
  payload: ICreateBlogPayload,
  file?: Express.Multer.File,
) => {
  if (!file) {
    throw new AppError(status.BAD_REQUEST, 'Blog image is required');
  }

  const uploadedImage = await uploadImage(file.buffer, BLOG_FOLDER);

  try {
    const created = await Blog.create({
      ...payload,
      image: uploadedImage,
    });
    return created.toObject();
  } catch (error: unknown) {
    await deleteImage(uploadedImage.publicId);
    throw error;
  }
};

const updateBlog = async (
  id: string,
  payload: IUpdateBlogPayload,
  file?: Express.Multer.File,
) => {
  const existing = await Blog.findById(id).select(BLOG_PROJECTION).lean();

  if (!existing) {
    throw new AppError(status.NOT_FOUND, 'Blog post not found');
  }

  const updateData: Partial<IBlog> = { ...payload };
  let newUploadedPublicId: string | undefined;

  if (file) {
    const uploadedImage = await uploadImage(file.buffer, BLOG_FOLDER);
    newUploadedPublicId = uploadedImage.publicId;
    updateData.image = uploadedImage;
  }

  try {
    const updated = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select(BLOG_PROJECTION)
      .lean();

    if (!updated) {
      if (newUploadedPublicId) {
        await deleteImage(newUploadedPublicId);
      }
      throw new AppError(status.NOT_FOUND, 'Blog post not found');
    }

    if (newUploadedPublicId && existing.image.publicId) {
      await deleteImage(existing.image.publicId);
    }

    return updated;
  } catch (error: unknown) {
    if (newUploadedPublicId) {
      await deleteImage(newUploadedPublicId);
    }
    throw error;
  }
};

const deleteBlog = async (id: string) => {
  const deleted = await Blog.findByIdAndDelete(id)
    .select(BLOG_PROJECTION)
    .lean();

  if (!deleted) {
    throw new AppError(status.NOT_FOUND, 'Blog post not found');
  }

  await deleteImage(deleted.image.publicId);
  return deleted;
};

export const BlogService = {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
};

