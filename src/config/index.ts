import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z.string().optional().default(''),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: z.string().min(1).default('7d'),
    CLIENT_URL: z.string().url().default('http://localhost:3000'),
    ADMIN_URL: z.string().url().default('http://localhost:3001'),
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
    CLOUDINARY_API_KEY: z.string().optional().default(''),
    CLOUDINARY_API_SECRET: z.string().optional().default(''),
    ADMIN_EMAIL: z.string().optional().default(''),
    ADMIN_PASSWORD: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET must be at least 32 characters in production',
        });
      }

      if (data.ADMIN_PASSWORD.length < 8) {
        ctx.addIssue({
          code: 'custom',
          path: ['ADMIN_PASSWORD'],
          message: 'ADMIN_PASSWORD must be at least 8 characters in production',
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[ERROR] Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.') || 'env'}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

const PLACEHOLDER_PATTERNS = [
  '<username>',
  '<password>',
  '<cluster>',
  'placeholder',
  'your_',
];

export function isPlaceholderMongoUri(uri: string): boolean {
  const trimmed = uri.trim();
  if (!trimmed) {
    return true;
  }

  const lower = trimmed.toLowerCase();
  if (!lower.startsWith('mongodb://') && !lower.startsWith('mongodb+srv://')) {
    return true;
  }

  return PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function parseDurationToMs(duration: string): number {
  const trimmed = duration.trim();
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(trimmed);

  if (!match || !match[1]) {
    // Default to 7 days if format is unrecognized
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();

  switch (unit) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  mongodbUri: env.MONGODB_URI,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  cors: {
    clientUrl: env.CLIENT_URL,
    adminUrl: env.ADMIN_URL,
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
  admin: {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },
} as const;

export default config;
