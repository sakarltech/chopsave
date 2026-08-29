# Vercel Staging Deployment

ChopSave uses two Vercel projects for its no-cost internal staging environment:

- `edo-languages-projects/api` with root directory `apps/api` (Fastify).
- `edo-languages-projects/web` with root directory `apps/web` (Next.js).

Vercel detects the pnpm monorepo and includes workspace packages outside each app root. The root `.vercelignore` and project-root ignore files prevent local environment files, build output, dependencies, and local Turbo caches from being uploaded.

## Git integration

Connect the `sakarltech/chopsave` GitHub repository to both Vercel projects. Configure `main` as each project’s production branch. Vercel then creates preview deployments for feature branches and deploys `main` to the shared internal staging environment.

## API environment variables

Set these variables in the Vercel `api` project for both Preview and Production. Use the same values initially because both environments share the Supabase staging database.

- `NODE_ENV=production` is set by Vercel for deployed functions.
- `DATABASE_URL`: Supabase **Transaction pooler** connection string (port `6543`) with SSL enabled. This is the correct choice for the Vercel serverless API.
- `REDIS_URL`: the Upstash **Redis Connect → Node/ioredis** TLS connection string (`rediss://default:...@...:6379`).
- `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`: staging-only RS256 PEM key pair.
- `PAYSTACK_SECRET_KEY` and `PAYSTACK_WEBHOOK_SECRET`: Paystack test credentials.
- `FLUTTERWAVE_SECRET_KEY` and `FLUTTERWAVE_WEBHOOK_SECRET`: staging credentials or non-empty test placeholders until Flutterwave is enabled.
- `TERMII_API_KEY`: staging credential or test placeholder while SMS delivery is not enabled.
- `FCM_SERVICE_ACCOUNT`: `{}` until push notifications are enabled.
- `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION`: staging object-storage credentials or non-empty placeholders while uploads are disabled.
- `GOOGLE_CLIENT_ID` and `APPLE_CLIENT_ID`: non-empty test placeholders until social login is enabled.

## Web environment variables

Set this variable in the Vercel `web` project for both Preview and Production:

- `NEXT_PUBLIC_API_URL`: the HTTPS domain for the Vercel `api` project, with no trailing slash.

After the first API deployment, copy its generated Vercel domain into this variable and redeploy the web project.

## Database migration and seed

Add `SUPABASE_STAGING_DATABASE_URL` to the GitHub `staging` environment as a secret. Use the Supabase **Session pooler** connection string (port `5432`), which is IPv4-compatible for GitHub-hosted runners and can run the migration DDL and PostGIS extension setup.

The `Prepare Vercel Staging Data` GitHub Action runs when migration/seed-related files reach `main`, and can be started manually. It applies migrations then runs the idempotent Lagos pilot seed. Use `NODE_ENV=production` in that action so the database client enables TLS.

## Staging limitations

- This stack is for internal testing only. Vercel Hobby is not intended for commercial use.
- Vercel does not run the persistent BullMQ workers. The API can enqueue jobs, but worker-driven notifications, reminders, payout settlement, and precise expiry automation remain unavailable until the worker architecture is replaced or hosted separately.
- The Supabase Free plan can pause after one week without sufficient database activity. Restore it from the Supabase dashboard if that occurs.
