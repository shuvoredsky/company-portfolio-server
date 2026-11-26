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

const preprocessOrderInput = (val: unknown): unknown => {
  if (val === '' || val === undefined || val === null) {
    return undefined;
  }
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    return Number(trimmed);
  }
  return val;
};

const baseOrderNumber = z
  .number({ message: 'Order must be a valid number' })
  .refine((n) => Number.isFinite(n), 'Order must be a valid number')
  .int('Order must be a whole number')
  .min(0, 'Order must be 0 or greater')
  .max(9999, 'Order must not exceed 9999');

const createOrderSchema = z.preprocess(
  preprocessOrderInput,
  baseOrderNumber.optional().default(0),
);

const updateOrderSchema = z.preprocess(
  preprocessOrderInput,
  baseOrderNumber.optional(),
);

const createBannerSchema = z.object({
  body: z
    .object({
      order: createOrderSchema,
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
      order: updateOrderSchema,
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
