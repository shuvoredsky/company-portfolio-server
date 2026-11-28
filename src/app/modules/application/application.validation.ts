import { z } from 'zod';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;
export const SERIAL_NUMBER_REGEX = /^[A-Z0-9][A-Z0-9-]{4,29}$/;
const PHONE_REGEX = /^[0-9+\-\s()]+$/;
const PASSPORT_REGEX = /^[A-Za-z0-9\s-]+$/;

const statusEnum = z.enum(['pending', 'approved', 'rejected']);

const serialNumberField = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine((val) => SERIAL_NUMBER_REGEX.test(val), {
    message:
      'Serial number must be 5 to 30 characters (A-Z, 0-9, and hyphens only) and start with a letter or digit',
  });

const optionalNoteField = z
  .string()
  .trim()
  .max(1000, 'Note must not exceed 1000 characters')
  .optional();

const optionalPassportField = z
  .string()
  .trim()
  .max(30, 'Passport number must not exceed 30 characters')
  .refine((val) => val === '' || PASSPORT_REGEX.test(val), {
    message:
      'Passport number may only contain letters, digits, spaces, and hyphens',
  })
  .optional();

const optionalVisaStatusField = z
  .string()
  .trim()
  .max(100, 'Visa status must not exceed 100 characters')
  .optional();

const createApplicationSchema = z.object({
  body: z.object({
    serialNumber: serialNumberField,
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, 'Email must not exceed 254 characters')
      .email('Please provide a valid email address'),
    phone: z
      .string()
      .trim()
      .min(6, 'Phone number must be at least 6 characters')
      .max(20, 'Phone number must not exceed 20 characters')
      .regex(
        PHONE_REGEX,
        'Phone number may only contain digits, spaces, +, -, and parentheses',
      ),
    note: optionalNoteField,
    passportNumber: optionalPassportField,
    visaStatus: optionalVisaStatusField,
    status: statusEnum.optional().default('pending'),
  }),
});

const updateApplicationSchema = z.object({
  params: z.object({
    id: z.string().regex(OBJECT_ID_REGEX, 'Invalid application ID format'),
  }),
  body: z
    .object({
      serialNumber: serialNumberField.optional(),
      name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .optional(),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .max(254, 'Email must not exceed 254 characters')
        .email('Please provide a valid email address')
        .optional(),
      phone: z
        .string()
        .trim()
        .min(6, 'Phone number must be at least 6 characters')
        .max(20, 'Phone number must not exceed 20 characters')
        .regex(
          PHONE_REGEX,
          'Phone number may only contain digits, spaces, +, -, and parentheses',
        )
        .optional(),
      note: optionalNoteField,
      passportNumber: optionalPassportField,
      visaStatus: optionalVisaStatusField,
      status: statusEnum.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update',
    }),
});

const applicationIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(OBJECT_ID_REGEX, 'Invalid application ID format'),
  }),
});

const listApplicationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: statusEnum.optional(),
    search: z.string().trim().max(100).optional(),
  }),
});

const checkApplicationStatusSchema = z.object({
  body: z.object({
    serialNumber: serialNumberField,
  }),
});

export const ApplicationValidation = {
  createApplicationSchema,
  updateApplicationSchema,
  applicationIdParamSchema,
  listApplicationsQuerySchema,
  checkApplicationStatusSchema,
};

