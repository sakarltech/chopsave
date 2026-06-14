import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3001').transform(Number),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // JWT — RS256 keys (PEM encoded, newlines as \n in env)
  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required'),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().min(1, 'PAYSTACK_SECRET_KEY is required'),
  PAYSTACK_WEBHOOK_SECRET: z.string().min(1, 'PAYSTACK_WEBHOOK_SECRET is required'),

  // Flutterwave
  FLUTTERWAVE_SECRET_KEY: z.string().min(1, 'FLUTTERWAVE_SECRET_KEY is required'),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().min(1, 'FLUTTERWAVE_WEBHOOK_SECRET is required'),

  // Termii SMS
  TERMII_API_KEY: z.string().min(1, 'TERMII_API_KEY is required'),

  // Firebase Cloud Messaging
  FCM_SERVICE_ACCOUNT: z.string().min(1, 'FCM_SERVICE_ACCOUNT is required'),

  // AWS S3 / Cloudflare R2
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_REGION: z.string().default('eu-west-1'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  APPLE_CLIENT_ID: z.string().min(1, 'APPLE_CLIENT_ID is required'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}

// Validate and export — this runs at module import time
export const env = validateEnv();
