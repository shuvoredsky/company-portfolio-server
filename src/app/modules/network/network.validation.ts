import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid network ID format');

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const createExternalUrlSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed === '' ? undefined : trimmed;
    }
    return val;
  },
  z
    .string()
    .max(500, 'External URL must not exceed 500 characters')
    .refine(
      isValidHttpUrl,
      'External URL must be a valid http or https URL',
    )
    .optional(),
);

const updateExternalUrlSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim() : val),
  z
    .union([
      z.literal(''),
      z
        .string()
        .max(500, 'External URL must not exceed 500 characters')
        .refine(
          isValidHttpUrl,
          'External URL must be a valid http or https URL',
        ),
    ])
    .optional(),
);

const listNetworksQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().max(200).optional(),
  }),
});

const networkIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const createNetworkSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Title must not exceed 200 characters'),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must not exceed 5000 characters'),
    externalUrl: createExternalUrlSchema,
  }),
});

const updateNetworkSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Title must not exceed 200 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must not exceed 5000 characters')
      .optional(),
    externalUrl: updateExternalUrlSchema,
  }),
});

export const NetworkValidation = {
  listNetworksQuerySchema,
  networkIdParamSchema,
  createNetworkSchema,
  updateNetworkSchema,
};

