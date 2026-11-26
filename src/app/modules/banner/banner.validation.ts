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
  body: z
    .object({
      order: z.coerce.number().int().default(0),
      isActive: booleanFromMultipart.optional().default(true),
    })
    .default({ order: 0, isActive: true }),
});

const updateBannerSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      order: z.coerce.number().int().optional(),
      isActive: booleanFromMultipart.optional(),
    })
    .default({}),
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
