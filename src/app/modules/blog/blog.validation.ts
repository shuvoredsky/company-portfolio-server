import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid blog ID format');

const listBlogsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().max(200).optional(),
  }),
});

const blogIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const createBlogSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(300, 'Title must not exceed 300 characters'),
    description: z.string().trim().min(1, 'Description is required'),
  }),
});

const updateBlogSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().min(1).optional(),
  }),
});

export const BlogValidation = {
  listBlogsQuerySchema,
  blogIdParamSchema,
  createBlogSchema,
  updateBlogSchema,
};

