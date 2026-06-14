# Railway staging deployment

This repository deploys staging through `.github/workflows/deploy-staging-railway.yml`.

The workflow:

1. Ensures a Railway environment named `staging` exists.
2. Deploys the Fastify API service to that environment.
3. Deploys the Next.js web service to that environment.
4. Optionally smoke-tests the API health endpoint.

## Railway project setup

Create or import the Railway project once, then add these services:

- API service for `@chopsave/api`
- Web service for `@chopsave/web`
- PostgreSQL service
- Redis service

The API and web services should both point at this GitHub repository. The workflow deploys from the monorepo root and copies the matching config from `.railway-config/*.railway.json` into a temporary `railway.json` before running `railway up`.

## GitHub secrets

Add these repository or environment secrets:

- `RAILWAY_API_TOKEN`: Railway account or workspace token used to inspect and create environments.
- `RAILWAY_TOKEN`: Railway project token used to deploy.
- `RAILWAY_PROJECT_ID`: Railway project ID.
- `RAILWAY_API_SERVICE`: Railway API service name or ID.
- `RAILWAY_WEB_SERVICE`: Railway web service name or ID.

## GitHub environment variables

Create a GitHub environment named `staging` and optionally add:

- `RAILWAY_STAGING_API_URL`: Public API URL, without a trailing slash, used by the smoke test.

## Railway environment variables

Set these on the Railway `staging` environment for the API service:

- `NODE_ENV=production`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_WEBHOOK_SECRET`
- `TERMII_API_KEY`
- `FCM_SERVICE_ACCOUNT`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `GOOGLE_CLIENT_ID`
- `APPLE_CLIENT_ID`

Set these on the Railway `staging` environment for the web service:

- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL`

## Manual deployment

Run the workflow from GitHub Actions with `workflow_dispatch` to deploy either service independently. Pushes to `main` deploy both services to Railway staging.
