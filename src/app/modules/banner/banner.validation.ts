import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid banner ID format');

const booleanFromMultipart = z.preprocess((val) => {
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return val;
}, z.boolean());

const createBannerSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Title must not exceed 200 characters'),
    subtitle: z.string().trim().max(500).optional(),
    ctaText: z.string().trim().max(100).optional(),
    ctaLink: z.string().trim().max(500).optional(),
    order: z.coerce.number().int().default(0),
    isActive: booleanFromMultipart.optional().default(true),
  }),
});

const updateBannerSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    subtitle: z.string().trim().max(500).optional(),
    ctaText: z.string().trim().max(100).optional(),
    ctaLink: z.string().trim().max(500).optional(),
    order: z.coerce.number().int().optional(),
    isActive: booleanFromMultipart.optional(),
  }),
});

const bannerIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const BannerValidation = {
  createBannerSchema,
  updateBannerSchema,
  bannerIdParamSchema,
};

