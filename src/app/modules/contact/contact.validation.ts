import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid contact ID format');

const createContactSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),
    country: z
      .string()
      .trim()
      .min(1, 'Country is required')
      .max(100, 'Country must not exceed 100 characters'),
    phone: z
      .string()
      .trim()
      .min(6, 'Phone must be at least 6 characters')
      .max(20, 'Phone must not exceed 20 characters')
      .regex(
        /^[0-9+\-\s()]+$/,
        'Phone may only contain digits, spaces, +, -, and parentheses',
      ),
    email: z
      .string()
      .trim()
      .email('Please provide a valid email address')
      .toLowerCase(),
    message: z
      .string()
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(2000, 'Message must not exceed 2000 characters'),
    website: z.string().optional(),
  }),
});

const listContactsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    isRead: z.enum(['true', 'false']).optional(),
    search: z.string().trim().max(200).optional(),
  }),
});

const contactIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

const markReadSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      isRead: z.boolean().default(true),
    })
    .optional()
    .default({ isRead: true }),
});

export const ContactValidation = {
  createContactSchema,
  listContactsQuerySchema,
  contactIdParamSchema,
  markReadSchema,
};
